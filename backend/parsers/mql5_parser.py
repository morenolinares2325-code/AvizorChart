# backend/parsers/mql5_parser.py
import re
from typing import Optional

class RobustMQL5Parser:
    """
    Parser integral y robusto para MQL5 orientado a AvizorChart.
    Diseñado para extraer exhaustivamente todo el contexto necesario:
    propiedades del script, inputs, buffers, funciones técnicas (iRSI, iMA),
    operaciones de trading y objetos de dibujo gráfico.
    """
    def __init__(self, source_code: str):
        self.source_code = source_code

    def parse(self) -> dict:
        """Ejecuta el análisis y emite un paquete JSON completo con toda la estructura."""
        return {
            "language": "mql5",
            "script_type": self._extract_script_type(),
            "properties": self._extract_properties(),
            "inputs": self._extract_inputs(),
            "technical_analysis": self._extract_ta_functions(),
            "trading_operations": self._extract_trading_calls(),
            "visual_objects": self._extract_visuals(),
            "signals": self._extract_signals(),
            "raw_lines_count": len(self.source_code.splitlines())
        }

    def _extract_script_type(self) -> str:
        """Determina si es un Expert Advisor, un Indicador o un Script."""
        if "OnCalculate" in self.source_code and "indicator_chart_window" in self.source_code:
            return "indicator"
        elif "OnTick" in self.source_code:
            return "expert_advisor"
        elif "OnStart" in self.source_code:
            return "script"
        return "unknown"

    def _extract_properties(self) -> dict:
        """Extrae las directivas de preprocesador #property."""
        props = {}
        matches = re.findall(r'#property\s+(\w+)\s+(.+)', self.source_code)
        for key, val in matches:
            props[key] = val.strip()
        return props

    def _extract_inputs(self) -> dict:
        """Extrae los parámetros configurables de usuario (input / sinput)."""
        inputs = {}
        # Ejemplo: input int InpRSIPeriod = 14;
        pattern = re.compile(r'(?:input|sinput)\s+(\w+)\s+(\w+)\s*=\s*(.+?);')
        matches = pattern.findall(self.source_code)
        for var_type, name, default_val in matches:
            inputs[name] = {
                "type": var_type,
                "default": default_val.strip()
            }
        return inputs

    def _extract_ta_functions(self) -> list:
        """Extrae iBands/iRSI/iStochastic/iMA y equivalentes Ci*.Create con paréntesis balanceados."""
        skip = {
            "if",
            "int",
            "init",
            "oninit",
            "input",
            "indicatorbuffered",
            "itime",
            "iclose",
            "iopen",
            "ihigh",
            "ilow",
            "ivolume",
            "ibarshift",
            "ihighest",
            "ilowest",
            "icustom",
            "itickvolume",
            "ispread",
            "irealvolume",
        }
        ta_calls = []
        seen = set()
        pattern = re.compile(
            r"(?:(?P<assigned>\w+)\s*=\s*)?(?P<function>i[A-Za-z]\w*|Ci(?:Bands|RSI|Stochastic|MA|ATR|MACD|StdDev|CCI|WPR|Momentum|Envelopes|ADX|SAR))\s*\(",
            re.I,
        )
        offset = 0
        while True:
            match = pattern.search(self.source_code, offset)
            if not match:
                break
            open_index = match.end() - 1
            close_index = self._matching_paren(open_index)
            func = match.group("function")
            key = re.sub(r"[^a-z]", "", func.lower())
            args = self.source_code[open_index + 1 : close_index].strip()
            offset = close_index + 1
            if key in skip:
                continue
            fingerprint = (func.lower(), args)
            if fingerprint in seen:
                continue
            seen.add(fingerprint)
            ta_calls.append(
                {
                    "assigned_variable": match.group("assigned"),
                    "function": func,
                    "arguments": args,
                }
            )

        create_pat = re.compile(r"(?P<obj>\w+)\.Create\s*\(", re.I)
        offset = 0
        while True:
            match = create_pat.search(self.source_code, offset)
            if not match:
                break
            open_index = match.end() - 1
            close_index = self._matching_paren(open_index)
            args = self.source_code[open_index + 1 : close_index].strip()
            offset = close_index + 1
            obj = match.group("obj")
            declared = re.search(rf"\b(Ci\w+)\s+{re.escape(obj)}\b", self.source_code)
            func = declared.group(1) if declared else obj
            ta_calls.append(
                {
                    "assigned_variable": obj,
                    "function": func,
                    "arguments": args,
                }
            )
        return ta_calls

    def _matching_paren(self, open_index: int) -> int:
        depth = 0
        quote = ""
        for index in range(open_index, len(self.source_code)):
            char = self.source_code[index]
            if quote:
                if char == quote:
                    quote = ""
                continue
            if char in {'"', "'"}:
                quote = char
                continue
            if char == "(":
                depth += 1
            elif char == ")":
                depth -= 1
                if depth == 0:
                    return index
        return len(self.source_code) - 1

    def _extract_signals(self) -> dict:
        """Condiciones de bucles, flechas DRAW_ARROW/OBJ_ARROW y umbrales Buy/Sell."""
        text = self.source_code
        lower = text.lower()
        has_arrows = bool(
            re.search(
                r"draw_arrow|obj_arrow|arrow_buy|arrow_sell|signalbuy|signalsell|plotindexsetinteger",
                lower,
            )
        )
        has_buy = bool(re.search(r"\b(buy|compra|long|arrowup|arrow_buy|signalbuy)\b", lower))
        has_sell = bool(re.search(r"\b(sell|venta|short|arrowdown|arrow_sell|signalsell)\b", lower))
        thresholds = self._extract_signal_thresholds()
        conditions = []
        for match in re.finditer(
            r"if\s*\((.{8,500}?)\)\s*(\{.{0,600}?\}|[^;{]{0,240};)",
            text,
            re.I | re.S,
        ):
            header = match.group(1)
            body = match.group(0)
            blob = f"{header} {body}".lower()
            side = None
            if re.search(r"buy|compra|arrow_buy|arrowup|signalbuy|obj_arrow_buy", blob):
                side = "buy"
            elif re.search(r"sell|venta|arrow_sell|arrowdown|signalsell|obj_arrow_sell", blob):
                side = "sell"
            if not side:
                continue
            rules = self._comparisons_to_rules(header, thresholds)
            conditions.append({"side": side, "condition": re.sub(r"\s+", " ", header).strip(), "rules": rules})
        return {
            "has_arrows": has_arrows,
            "has_buy": has_buy,
            "has_sell": has_sell,
            "thresholds": thresholds,
            "conditions": conditions,
        }

    def _extract_signal_thresholds(self) -> dict:
        found: dict[str, float] = {}
        for name, meta in self._extract_inputs().items():
            key = name.lower()
            raw = str((meta or {}).get("default") or "")
            number = re.search(r"-?\d+(?:\.\d+)?", raw)
            if not number:
                continue
            value = float(number.group(0))
            if re.search(r"oversold|oslevel|buylevel|buyrsi|rsi_?buy|rsi_?os", key):
                found["rsi_buy"] = value
            elif re.search(r"overbought|oblevel|selllevel|sellrsi|rsi_?sell|rsi_?ob", key):
                found["rsi_sell"] = value
            elif re.search(r"stoch.*buy|kbuy|k_?os|stochos", key):
                found["stoch_buy"] = value
            elif re.search(r"stoch.*sell|ksell|k_?ob|stochob", key):
                found["stoch_sell"] = value
        for match in re.finditer(
            r"(rsi|stoch|%k|kbuffer|dbuffer|bands?(?:up|down|low|high|upper|lower)?)\s*(?:\[.*?\])?\s*(<=|>=|<|>)\s*([A-Za-z0-9_.]+)",
            self.source_code,
            re.I,
        ):
            left, op, right = match.group(1).lower(), match.group(2), match.group(3)
            number = self._resolve_number(right)
            if number is None:
                continue
            if "rsi" in left:
                found["rsi_buy" if "<" in op else "rsi_sell"] = number
            elif "stoch" in left or left in {"%k", "kbuffer"}:
                found["stoch_buy" if "<" in op else "stoch_sell"] = number
        return found

    def _resolve_number(self, token: str):
        direct = re.search(r"-?\d+(?:\.\d+)?", token)
        if token.replace(".", "", 1).isdigit() or (direct and re.fullmatch(r"-?\d+(?:\.\d+)?", token.strip())):
            return float(token)
        inputs = self._extract_inputs()
        meta = inputs.get(token)
        if not meta:
            for name, item in inputs.items():
                if name.lower() == token.lower():
                    meta = item
                    break
        if not meta:
            return None
        hit = re.search(r"-?\d+(?:\.\d+)?", str(meta.get("default") or ""))
        return float(hit.group(0)) if hit else None

    def _comparisons_to_rules(self, condition: str, thresholds: dict) -> list:
        rules = []
        for match in re.finditer(
            r"([A-Za-z_][\w]*)\s*(?:\[.*?\])?\s*(<=|>=|<|>)\s*([A-Za-z0-9_.]+)",
            condition,
        ):
            left, op, right = match.group(1), match.group(2), match.group(3)
            kind = self._token_kind(left)
            if not kind:
                kind = self._token_kind(right)
                if not kind:
                    continue
                left, right, op = right, left, {">": "<", "<": ">", ">=": "<=", "<=": ">="}.get(op, op)
            number = self._resolve_number(right)
            rules.append(
                {
                    "kind": kind,
                    "op": op,
                    "value": number,
                    "ref": right,
                    "left": left,
                }
            )
        if re.search(r"lower|band.*low|bb_?low|banda.*inf", condition, re.I):
            rules.append({"kind": "bb_lower", "op": "<=", "value": None, "ref": "lower", "left": "close"})
        if re.search(r"upper|band.*up|bb_?up|banda.*sup", condition, re.I):
            rules.append({"kind": "bb_upper", "op": ">=", "value": None, "ref": "upper", "left": "close"})
        if not any(item["kind"] == "rsi" for item in rules) and thresholds:
            pass
        return rules

    def _token_kind(self, token: str) -> Optional[str]:
        key = re.sub(r"[^a-z]", "", token.lower())
        if "rsi" in key:
            return "rsi"
        if "stoch" in key or key in {"kbuffer", "percentk", "signalk"}:
            return "stoch"
        if "lower" in key or key.endswith("low") and "band" in key:
            return "bb_lower"
        if "upper" in key or ("band" in key and "up" in key):
            return "bb_upper"
        if key in {"close", "bid", "price"}:
            return "close"
        return None

    def _extract_trading_calls(self) -> list:
        """Extrae funciones de ejecución de órdenes (OrderSend, PositionOpen, etc.)."""
        trading_calls = []
        matches = re.findall(r'(OrderSend|PositionOpen|MqlTradeRequest)\b', self.source_code)
        for match in matches:
            trading_calls.append({"action": match})
        return trading_calls

    def _extract_visuals(self) -> list:
        """Extrae objetos gráficos creados en el chart (ObjectCreate, OBJ_TREND, etc.)."""
        visuals = []
        matches = re.findall(r'ObjectCreate\s*\((.*?)\)', self.source_code)
        for args in matches:
            visuals.append({
                "type": "object_create",
                "arguments": args.strip()
            })
            
        return visuals

def parse_mql5_script_comprehensive(code: str) -> dict:
    parser = RobustMQL5Parser(code)
    return parser.parse()
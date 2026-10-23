# backend/parsers/pine_parser.py
import re


def _matching_paren(source: str, open_index: int) -> int:
    depth = 0
    quote = ""
    for index in range(open_index, len(source)):
        char = source[index]
        if quote:
            if char == quote and source[index - 1] != "\\":
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
    return len(source) - 1


def _scan_calls(source: str, pattern: str) -> list[dict]:
    calls = []
    offset = 0
    compiled = re.compile(pattern)
    while True:
        match = compiled.search(source, offset)
        if not match:
            break
        open_index = match.end() - 1
        if open_index >= len(source) or source[open_index] != "(":
            offset = match.end()
            continue
        close_index = _matching_paren(source, open_index)
        args = source[open_index + 1 : close_index].strip()
        payload = match.groupdict()
        payload["arguments"] = args
        payload["span"] = (match.start(), close_index + 1)
        calls.append(payload)
        offset = close_index + 1
    return calls


class RobustPineScriptParser:
    """
    Parser integral y robusto para Pine Script orientado a AvizorChart.
    Extrae metadatos, inputs, ta.*, órdenes de estrategia y primitivas visuales.
    """

    def __init__(self, source_code: str):
        self.source_code = source_code

    def parse(self) -> dict:
        return {
            "language": "pinescript",
            "version": self._extract_version(),
            "script_type": self._extract_script_type(),
            "inputs": self._extract_inputs(),
            "technical_analysis": self._extract_ta_functions(),
            "strategy_orders": self._extract_strategy_calls(),
            "visual_elements": self._extract_visuals(),
            "raw_lines_count": len(self.source_code.splitlines()),
        }

    def _extract_version(self) -> str:
        match = re.search(r"//@version=(\d+)", self.source_code)
        return match.group(1) if match else "5"

    def _extract_script_type(self) -> str:
        if "strategy(" in self.source_code:
            return "strategy"
        if "indicator(" in self.source_code or "study(" in self.source_code:
            return "indicator"
        if "library(" in self.source_code:
            return "library"
        return "unknown"

    def _extract_inputs(self) -> dict:
        inputs = {}
        for call in _scan_calls(self.source_code, r"(?P<name>\w+)\s*=\s*input\.(?P<type>\w+)\s*\("):
            inputs[call["name"]] = {
                "type": call["type"],
                "arguments": call["arguments"],
            }
        simple = re.findall(r"(\w+)\s*=\s*input\s*\((.*?)\)", self.source_code)
        for name, args in simple:
            inputs.setdefault(name, {"type": "float", "arguments": args.strip()})
        return inputs

    def _extract_ta_functions(self) -> list:
        ta_calls = []
        for call in _scan_calls(self.source_code, r"(?:(?P<assigned_variable>\w+)\s*=\s*)?(?P<function>ta\.\w+)\s*\("):
            ta_calls.append(
                {
                    "assigned_variable": call.get("assigned_variable") or None,
                    "function": call["function"],
                    "arguments": call["arguments"],
                }
            )
        return ta_calls

    def _extract_strategy_calls(self) -> list:
        orders = []
        for call in _scan_calls(self.source_code, r"(?P<command>strategy\.\w+)\s*\("):
            orders.append({"command": call["command"], "arguments": call["arguments"]})
        return orders

    def _extract_visuals(self) -> list:
        visuals = []
        for call in _scan_calls(self.source_code, r"(?P<function>\bplot)\s*\("):
            visuals.append({"type": "plot", "expression": call["arguments"]})
        for call in _scan_calls(self.source_code, r"(?P<function>\bhline)\s*\("):
            visuals.append({"type": "hline", "expression": call["arguments"], "function": "hline"})
        for call in _scan_calls(self.source_code, r"(?P<function>(?:line|box|label|table)\.\w+)\s*\("):
            visuals.append(
                {
                    "type": "drawing_primitive",
                    "function": call["function"],
                    "arguments": call["arguments"],
                }
            )
        return visuals


def parse_pine_script_comprehensive(code: str) -> dict:
    parser = RobustPineScriptParser(code)
    return parser.parse()

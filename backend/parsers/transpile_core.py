"""Orquestador Pine/MQL5 → IR unificado → series Avizor + primitivas ECharts."""

from __future__ import annotations

import json
import re
from typing import Any, Optional

from .mql5_parser import parse_mql5_script_comprehensive
from .pine_parser import parse_pine_script_comprehensive

SERIES_COLORS = ("#00FF66", "#00E5FF", "#A78BFA", "#FBBF24", "#FF3366", "#38BDF8", "#F472B6")

PANE_METHODS = {"rsi", "roc", "stddev"}

SIGNAL_FUNCTIONS = {
    "ta.crossover",
    "ta.crossunder",
    "ta.cross",
    "ta.rising",
    "ta.falling",
    "ta.change",
    "ta.barssince",
    "ta.valuewhen",
    "ta.na",
    "ta.nz",
    "ta.iff",
    "ta.highestbars",
    "ta.lowestbars",
}

PINE_TA_MAP = {
    "ta.sma": "sma",
    "ta.ema": "ema",
    "ta.rma": "ema",
    "ta.wma": "sma",
    "ta.vwma": "sma",
    "ta.hma": "ema",
    "ta.tema": "ema",
    "ta.alma": "ema",
    "ta.kama": "ema",
    "ta.swma": "sma",
    "ta.linreg": "sma",
    "ta.rsi": "rsi",
    "ta.atr": "atr",
    "ta.tr": "atr",
    "ta.roc": "roc",
    "ta.mom": "roc",
    "ta.stdev": "stddev",
    "ta.stddev": "stddev",
    "ta.variance": "stddev",
    "ta.bb": "sma",
    "ta.bbw": "stddev",
    "ta.macd": "ema",
    "ta.vwap": "raw",
    "ta.supertrend": "atr",
    "ta.cci": "sma",
    "ta.mfi": "rsi",
    "ta.stoch": "rsi",
    "ta.willr": "roc",
    "ta.dmi": "atr",
    "ta.adx": "atr",
    "ta.sar": "ema",
    "ta.highest": "raw",
    "ta.lowest": "raw",
    "ta.sum": "sma",
    "ta.cum": "sma",
    "ta.percentile_linear_interpolation": "stddev",
}

MQL_TA_WHITELIST = {
    "ima": "iMA",
    "imaonarray": "iMAOnArray",
    "irsi": "iRSI",
    "iatr": "iATR",
    "istddev": "iStdDev",
    "imomentum": "iMomentum",
    "icci": "iCCI",
    "iwpr": "iWPR",
    "ibands": "iBands",
    "imacd": "iMACD",
    "istochastic": "iStochastic",
    "ienvelopes": "iEnvelopes",
}

PINE_COLORS = {
    "green": "#22c55e",
    "lime": "#00FF66",
    "red": "#ef4444",
    "maroon": "#FF073A",
    "blue": "#38bdf8",
    "aqua": "#00E5FF",
    "teal": "#14b8a6",
    "orange": "#fb923c",
    "yellow": "#eab308",
    "purple": "#a78bfa",
    "fuchsia": "#FF007F",
    "white": "#e4e4e7",
    "gray": "#71717a",
    "silver": "#a1a1aa",
}


def detect_language(source: str) -> str:
    text = source.lower()
    if "calgo" in text or "indicatordataseries" in text or "bars.closeprices" in text or "using calgo" in text:
        return "ctrader"
    if any(
        token in text
        for token in (
            "oncalculate",
            "ontick",
            "#property",
            "indicator_buffers",
            "indicator_chart_window",
            "indicator_separate_window",
            "mql5",
            "mql4",
            ".mq5",
            ".mqh",
        )
    ) or re.search(r"\bi(?:ma|rsi|atr|bands|macd|stochastic)\s*\(", text) or "cibands" in text or "cirsi" in text or "cistochastic" in text or "copybuffer" in text:
        return "mql5"
    if "//@version" in text or re.search(r"\b(?:indicator|strategy|study)\s*\(", text) or "ta." in text:
        return "pine"
    if "//@avizor" in text or re.search(r"^\s*(overlay|pane)\s+(ema|sma|rsi|atr)\s+", source, re.M):
        return "avizor"
    return "typescript"


def transpile(source: str, name_hint: str = "", language_hint: str = "") -> dict[str, Any]:
    code = source or ""
    hinted = (language_hint or "").strip().lower()
    language = hinted if hinted in {"pine", "mql5", "ctrader", "typescript", "avizor"} else detect_language(code)
    notes: list[str] = []

    if language in {"typescript", "avizor", "ctrader"}:
        return {
            "status": "passthrough",
            "language": language,
            "name": name_hint.strip() or "Indicador",
            "script_type": "indicator",
            "ir": None,
            "plots": [],
            "avizor": code,
            "echarts": empty_echarts(),
            "orders": [],
            "notes": ["El código ya es nativo Avizor/TypeScript. Compílalo en el IDE."],
        }

    ast = (
        parse_mql5_script_comprehensive(code)
        if language == "mql5"
        else parse_pine_script_comprehensive(code)
    )
    ir = unify_ir(ast, code, language, name_hint)
    plots, plot_notes = ir_to_plots(ir)
    notes.extend(plot_notes)
    if language == "mql5" and not plots:
        inferred, extra = infer_mql_plots(code, ir)
        plots.extend(inferred)
        notes.extend(extra)
    ai_logic = None
    try:
        from .builder_logic_ai import extract_logic_with_ai, last_ai_status

        ai_logic = extract_logic_with_ai(code, language, ir)
        if not ai_logic:
            status = last_ai_status()
            if status and status != "ok":
                notes.append(status)
    except Exception:
        ai_logic = None

    if language in {"mql5", "pine"}:
        signal_plots, signal_notes = mql_signal_plots(code, ir, plots)
        plots.extend(signal_plots)
        notes.extend(signal_notes)
    if ai_logic:
        plots, ai_notes = merge_ai_logic(plots, ir, ai_logic)
        notes.extend(ai_notes)
    echarts, visual_notes = ir_to_echarts(ir)
    notes.extend(visual_notes)
    echarts = enrich_echarts(echarts, plots, ai_logic)
    if ir["orders"]:
        notes.append(f"{len(ir['orders'])} operación(es) de trading detectadas (no se ejecutan en el gráfico).")
    if not plots:
        notes.append("El parser no encontró series plotables en este script.")

    avizor = plots_to_typescript(ir["name"], plots, ir.get("inputs") or [], echarts)
    engine = "RobustMQL5Parser" if language == "mql5" else "RobustPineScriptParser"
    layer = "parser+IA" if ai_logic else "parser"
    notes.insert(0, f"{engine} ({layer}) · {len(plots)} serie(s) listas para el Mega Gráfico.")
    return {
        "status": "success",
        "language": "mql5" if language == "mql5" else "pine",
        "name": ir["name"],
        "script_type": ir["script_type"],
        "ir": ir,
        "plots": plots,
        "avizor": avizor,
        "echarts": echarts,
        "orders": ir["orders"],
        "notes": [item for item in notes if "no mapeado" not in item.lower() and "no soportada" not in item.lower()],
    }


def unify_ir(ast: dict[str, Any], source: str, language: str, name_hint: str) -> dict[str, Any]:
    overlay = True
    name = name_hint.strip()
    if language == "pine":
        overlay = not re.search(r"(?:indicator|study|strategy)\s*\([^)]*overlay\s*=\s*false", source, re.I)
        if not name or name.lower() in {"indicador", "ema ribbon"}:
            name = extract_quoted(source, r"(?:indicator|study|strategy)\s*\(\s*([\"'])(.+?)\1") or "Indicador Pine"
        series = normalize_pine_series(ast.get("technical_analysis") or [])
        visuals = normalize_pine_visuals(ast.get("visual_elements") or [])
        orders = ast.get("strategy_orders") or []
        inputs = normalize_pine_inputs(ast.get("inputs") or {})
        signals = {}
    else:
        props = ast.get("properties") or {}
        overlay = "indicator_separate_window" not in source
        if not name or name.lower() in {"indicador", "ema ribbon"}:
            name = (
                strip_quotes(props.get("description", ""))
                or extract_quoted(source, r"//\|\s*([^*|\n]+?)\s*\|")
                or "Indicador MT5"
            )
        series = normalize_mql_series(ast.get("technical_analysis") or [], ast.get("inputs") or {})
        visuals = normalize_mql_visuals(ast.get("visual_objects") or [])
        orders = ast.get("trading_operations") or []
        inputs = normalize_mql_inputs(ast.get("inputs") or {})
        signals = ast.get("signals") or {}

    return {
        "language": language,
        "script_type": ast.get("script_type") or "indicator",
        "name": name.strip() or "Indicador",
        "overlay": overlay,
        "inputs": inputs,
        "series": series,
        "visuals": visuals,
        "orders": orders,
        "signals": signals,
        "raw_lines_count": ast.get("raw_lines_count") or 0,
        "properties": ast.get("properties") or {},
        "version": ast.get("version"),
    }


def ir_to_plots(ir: dict[str, Any]) -> tuple[list[dict[str, Any]], list[str]]:
    notes: list[str] = []
    plots: list[dict[str, Any]] = []
    seen: set[str] = set()
    defaults = {item["name"]: item["default"] for item in ir["inputs"] if item.get("default") is not None}
    overlay = bool(ir.get("overlay", True))

    visual_plots = [item for item in ir["visuals"] if item.get("kind") == "plot"]
    aliases = {row["var"]: row for row in ir["series"] if row.get("var")}
    if visual_plots:
        for visual in visual_plots:
            expr = str(visual.get("expression") or "")
            head = split_args(expr)[0] if expr else ""
            if is_signal_expr(head, aliases):
                continue
            mapped = map_expression(head, aliases, defaults, overlay) or map_expression(expr, aliases, defaults, overlay)
            if not mapped:
                continue
            method, source, period, pane = mapped
            color = parse_color(expr) or SERIES_COLORS[len(plots) % len(SERIES_COLORS)]
            title = extract_title(expr) or default_name(method, period, source)
            push_plot(plots, seen, method, source, period, pane, title, color, len(plots))
        if plots:
            return plots, notes

    for row in ir["series"]:
        fn = str(row.get("function") or "").lower()
        if fn in SIGNAL_FUNCTIONS:
            continue
        if ir.get("language") == "mql5":
            named = mql_named_plots(row, defaults, overlay)
            for method, source, period, pane, title in named:
                color = SERIES_COLORS[len(plots) % len(SERIES_COLORS)]
                push_plot(plots, seen, method, source, period, pane, title, color, len(plots))
            continue
        mapped_rows = map_ta_call(row, defaults, overlay)
        if not mapped_rows:
            continue
        for method, source, period, pane in mapped_rows:
            title = default_name(method, period, source)
            color = SERIES_COLORS[len(plots) % len(SERIES_COLORS)]
            push_plot(plots, seen, method, source, period, pane, title, color, len(plots))

    return plots, notes


def ir_to_echarts(ir: dict[str, Any]) -> tuple[dict[str, Any], list[str]]:
    notes: list[str] = []
    mark_lines: list[dict[str, Any]] = []
    mark_areas: list[dict[str, Any]] = []
    mark_points: list[dict[str, Any]] = []
    graphic: list[dict[str, Any]] = []
    primitives: list[dict[str, Any]] = []

    for visual in ir["visuals"]:
        kind = visual.get("kind")
        if kind in {"plot"}:
            continue
        primitive = {
            "type": kind,
            "name": visual.get("name") or kind,
            "color": visual.get("color") or ("#10B981" if kind in {"support", "trendline"} else "#EF4444"),
            "source": visual.get("raw"),
        }
        primitives.append(primitive)
        if kind in {"support", "resistance", "hline"}:
            mark_lines.append(
                {
                    "name": primitive["name"],
                    "lineStyle": {
                        "color": primitive["color"],
                        "type": "dashed",
                        "width": 1.4,
                    },
                    "label": {"formatter": primitive["name"], "position": "end"},
                }
            )
        elif kind in {"pattern_box", "box"}:
            mark_areas.append(
                {
                    "name": primitive["name"],
                    "itemStyle": {"color": "rgba(0,255,102,0.08)"},
                }
            )
        elif kind == "trendline":
            mark_lines.append(
                {
                    "name": primitive["name"],
                    "lineStyle": {"color": primitive["color"], "type": "solid", "width": 1.2},
                    "label": {"formatter": "Trend", "position": "end"},
                }
            )

    if primitives:
        notes.append(f"{len(primitives)} primitiva(s) visual(es) mapeadas a ECharts.")
    return {
        "markLines": mark_lines,
        "markAreas": mark_areas,
        "markPoints": mark_points,
        "graphic": graphic,
        "primitives": primitives,
    }, notes


def plots_to_typescript(
    name: str,
    plots: list[dict[str, Any]],
    inputs: Optional[list[dict[str, Any]]] = None,
    echarts: Optional[dict[str, Any]] = None,
) -> str:
    lines = [
        'import { overlay, pane, ema, sma, rsi, atr, roc, stddev, close, signalBuy, signalSell, markLine, markArea, label } from "@avizor/chart";',
        "",
        f"export const name = {json.dumps(name)};",
        "",
    ]
    if inputs:
        lines.append("// Inputs extraídos del script original")
        for item in inputs:
            default = item.get("default")
            label = item.get("name")
            if default is None:
                lines.append(f"// {label}")
            else:
                lines.append(f"const {label} = {default};")
        lines.append("")
    if not plots:
        lines.append("// No hay series plotables para ECharts en este script.")
        lines.extend(["", "export default { name };", ""])
        return "\n".join(lines)
    for plot in plots:
        if plot["method"] in {"signal_buy", "signal_sell"}:
            fn = "signalBuy" if plot["method"] == "signal_buy" else "signalSell"
            spec = plot.get("signal") or {"side": "buy" if plot["method"] == "signal_buy" else "sell"}
            lines.append(
                f'{fn}({json.dumps(spec, ensure_ascii=False)}, {{ color: {json.dumps(plot["color"])}, title: {json.dumps(plot["name"])} }});'
            )
            continue
        fn = "pane" if plot["pane"] == "pane" else "overlay"
        call = plot["source"] if plot["method"] == "raw" else f'{plot["method"]}({plot["source"]}, {plot["period"]})'
        lines.append(
            f'{fn}({call}, {{ color: {json.dumps(plot["color"])}, width: {plot["width"]}, title: {json.dumps(plot["name"])} }});'
        )
    payload = echarts or {}
    for item in payload.get("markLines") or []:
        if item.get("yAxis") is None:
            continue
        lines.append(
            f'markLine({{ name: {json.dumps(item.get("name") or "Nivel")}, y: {item["yAxis"]}, color: {json.dumps((item.get("lineStyle") or {}).get("color") or "#a1a1aa")}, style: {json.dumps((item.get("lineStyle") or {}).get("type") or "dashed")} }});'
        )
    for item in payload.get("markAreas") or []:
        pair = item if isinstance(item, list) and len(item) >= 2 else None
        if not pair:
            continue
        y0 = pair[0].get("yAxis")
        y1 = pair[1].get("yAxis")
        if y0 is None or y1 is None:
            continue
        color = (pair[0].get("itemStyle") or {}).get("color") or "rgba(0,255,102,0.12)"
        lines.append(
            f'markArea({{ name: {json.dumps(pair[0].get("name") or "Zona")}, y0: {y0}, y1: {y1}, color: {json.dumps(color)} }});'
        )
    for item in payload.get("graphic") or []:
        style = item.get("style") or {}
        text = style.get("text")
        if not text:
            continue
        lines.append(
            f'label({{ name: {json.dumps(text)}, text: {json.dumps(text)}, color: {json.dumps(style.get("fill") or "#e4e4e7")} }});'
        )
    lines.extend(["", "export default { name };", ""])
    return "\n".join(lines)


def empty_echarts() -> dict[str, Any]:
    return {"markLines": [], "markAreas": [], "markPoints": [], "graphic": [], "primitives": []}


def normalize_pine_inputs(raw: dict[str, Any]) -> list[dict[str, Any]]:
    items = []
    for name, meta in raw.items():
        args = str((meta or {}).get("arguments") or "")
        items.append(
            {
                "name": name,
                "type": (meta or {}).get("type") or "int",
                "default": first_number(args),
                "arguments": args,
            }
        )
    return items


def normalize_mql_inputs(raw: dict[str, Any]) -> list[dict[str, Any]]:
    items = []
    for name, meta in raw.items():
        default = (meta or {}).get("default")
        items.append(
            {
                "name": name,
                "type": (meta or {}).get("type") or "double",
                "default": first_number(str(default or "")),
                "arguments": str(default or ""),
            }
        )
    return items


def normalize_pine_series(calls: list[dict[str, Any]]) -> list[dict[str, Any]]:
    series = []
    for call in calls:
        fn = str(call.get("function") or "")
        series.append(
            {
                "var": call.get("assigned_variable"),
                "function": fn,
                "args": split_args(str(call.get("arguments") or "")),
            }
        )
    return series


def normalize_mql_series(calls: list[dict[str, Any]], _inputs: Optional[dict[str, Any]] = None) -> list[dict[str, Any]]:
    series = []
    for call in calls:
        fn = str(call.get("function") or "")
        kind = mql_indicator_kind(fn)
        if not kind:
            continue
        series.append(
            {
                "var": call.get("assigned_variable"),
                "function": fn,
                "kind": kind,
                "args": split_args(str(call.get("arguments") or "")),
            }
        )
    return series


def mql_indicator_kind(fn: str) -> Optional[str]:
    compact = re.sub(r"[^a-z]", "", (fn or "").lower())
    if compact.startswith("c") and len(compact) > 3:
        compact = compact[1:]
    skip = {
        "if",
        "int",
        "input",
        "iclose",
        "iopen",
        "ihigh",
        "ilow",
        "itime",
        "ivolume",
        "ibarshift",
        "ihighest",
        "ilowest",
        "icustom",
        "itickvolume",
        "ispread",
        "irealvolume",
    }
    if compact in skip:
        return None
    for needle, kind in (
        ("stochastic", "stoch"),
        ("macd", "macd"),
        ("bands", "bands"),
        ("envelopes", "envelopes"),
        ("stddev", "stddev"),
        ("momentum", "momentum"),
        ("rsi", "rsi"),
        ("atr", "atr"),
        ("cci", "cci"),
        ("wpr", "wpr"),
        ("sar", "sar"),
        ("adx", "atr"),
        ("maonarray", "ma"),
        ("ima", "ma"),
    ):
        if needle in compact:
            return kind
    if compact.endswith("ma") or compact == "ma":
        return "ma"
    return None


def mql_named_plots(
    row: dict[str, Any],
    defaults: dict[str, Any],
    overlay: bool,
) -> list[tuple[str, str, int, str, str]]:
    fn = str(row.get("function") or "")
    args = list(row.get("args") or [])
    kind = row.get("kind") or mql_indicator_kind(fn)
    pane = "overlay" if overlay else "pane"
    src = mql_price(args[-1] if args else "PRICE_CLOSE")
    if kind == "bands":
        period = as_number(args[2] if len(args) > 2 else "20", defaults, 20)
        return [
            ("sma", src if src != "close" else "close", period, "overlay", f"BB Mid {period}"),
            ("stddev", "close", period, "overlay", f"BB Dev {period}"),
        ]
    if kind == "rsi":
        period = as_number(args[2] if len(args) > 2 else "14", defaults, 14)
        price = mql_price(args[3] if len(args) > 3 else "PRICE_CLOSE")
        return [("rsi", price, period, "pane", f"RSI {period}")]
    if kind == "stoch":
        k_period = as_number(args[2] if len(args) > 2 else "5", defaults, 5)
        d_period = as_number(args[3] if len(args) > 3 else "3", defaults, 3)
        return [
            ("rsi", "close", k_period, "pane", f"Stoch %K {k_period}"),
            ("sma", "close", d_period, "pane", f"Stoch %D {d_period}"),
        ]
    if kind == "ma":
        period = as_number(args[2] if len(args) > 2 else "21", defaults, 21)
        mode = (args[4] if len(args) > 4 else args[3] if len(args) > 3 else "").upper()
        method = "sma" if "SMA" in mode else "ema"
        price = mql_price(args[5] if len(args) > 5 else args[-1] if args else "PRICE_CLOSE")
        return [(method, price, period, pane, f"{method.upper()} {period}")]
    if kind == "atr":
        period = as_number(args[2] if len(args) > 2 else "14", defaults, 14)
        return [("atr", "close", period, pane, f"ATR {period}")]
    if kind == "macd":
        fast = as_number(args[2] if len(args) > 2 else "12", defaults, 12)
        slow = as_number(args[3] if len(args) > 3 else "26", defaults, 26)
        return [
            ("ema", "close", fast, "pane", f"MACD fast {fast}"),
            ("ema", "close", slow, "pane", f"MACD slow {slow}"),
        ]
    if kind == "stddev":
        period = as_number(args[2] if len(args) > 2 else "20", defaults, 20)
        return [("stddev", src, period, pane, f"StdDev {period}")]
    if kind == "momentum":
        period = as_number(args[2] if len(args) > 2 else "12", defaults, 12)
        return [("roc", src, period, "pane", f"Momentum {period}")]
    if kind == "cci":
        period = as_number(args[2] if len(args) > 2 else "20", defaults, 20)
        return [("sma", "hlc3", period, "pane", f"CCI {period}")]
    if kind == "wpr":
        period = as_number(args[2] if len(args) > 2 else "14", defaults, 14)
        return [("roc", "close", period, "pane", f"%R {period}")]
    if kind == "envelopes":
        period = as_number(args[2] if len(args) > 2 else "14", defaults, 14)
        return [("ema", "close", period, "overlay", f"Envelopes {period}")]
    if kind == "sar":
        return [("ema", "close", 14, "overlay", "SAR")]
    return []


def infer_mql_plots(source: str, ir: dict[str, Any]) -> tuple[list[dict[str, Any]], list[str]]:
    defaults = {item["name"]: item["default"] for item in ir.get("inputs") or [] if item.get("default") is not None}
    overlay = bool(ir.get("overlay", True))
    text = source.lower()
    specs: list[tuple[str, str, int, str, str]] = []
    if re.search(r"band|bollinger", text):
        period = pick_mql_period(defaults, ["bb", "band", "bol"], 20)
        specs.extend(
            [
                ("sma", "close", period, "overlay", f"BB Mid {period}"),
                ("stddev", "close", period, "overlay", f"BB Dev {period}"),
            ]
        )
    if re.search(r"\brsi\b", text):
        period = pick_mql_period(defaults, ["rsi"], 14)
        specs.append(("rsi", "close", period, "pane", f"RSI {period}"))
    if re.search(r"stoch", text):
        k_period = pick_mql_period(defaults, ["kperiod", "k_period", "stochk", "percentk", "inp_k"], 5)
        d_period = pick_mql_period(defaults, ["dperiod", "d_period", "stochd", "percentd", "inp_d", "slowing"], 3)
        specs.extend(
            [
                ("rsi", "close", k_period, "pane", f"Stoch %K {k_period}"),
                ("sma", "close", d_period, "pane", f"Stoch %D {d_period}"),
            ]
        )
    if not specs:
        return [], []
    plots: list[dict[str, Any]] = []
    seen: set[str] = set()
    for method, source_id, period, pane, title in specs:
        color = SERIES_COLORS[len(plots) % len(SERIES_COLORS)]
        push_plot(plots, seen, method, source_id, period, pane, title, color, len(plots))
    return plots, [f"Series reconstruidas desde inputs/funciones MQL5 ({len(plots)})."]


def pick_mql_period(defaults: dict[str, Any], needles: list[str], fallback: int) -> int:
    for name, value in defaults.items():
        key = name.lower()
        if any(token in key for token in needles) and value is not None:
            try:
                return max(1, int(value))
            except (TypeError, ValueError):
                continue
    for value in defaults.values():
        try:
            number = int(value)
        except (TypeError, ValueError):
            continue
        if number > 1:
            return number
    return fallback


def mql_signal_plots(
    source: str,
    ir: dict[str, Any],
    plots: list[dict[str, Any]],
) -> tuple[list[dict[str, Any]], list[str]]:
    kinds = {str(row.get("kind") or mql_indicator_kind(str(row.get("function") or ""))) for row in ir.get("series") or []}
    plot_names = " ".join(item.get("name", "") for item in plots).lower()
    has_bb = "bands" in kinds or "bb " in plot_names or "bollinger" in source.lower()
    has_rsi = "rsi" in kinds or "rsi" in plot_names
    has_stoch = "stoch" in kinds or "stoch" in plot_names
    payload = ir.get("signals") or {}
    wants = bool(
        payload.get("has_arrows")
        or payload.get("has_buy")
        or payload.get("has_sell")
        or payload.get("conditions")
        or (has_bb and has_rsi and has_stoch)
    )
    if not wants:
        return [], []

    defaults = {item["name"]: item["default"] for item in ir.get("inputs") or [] if item.get("default") is not None}
    thresholds = dict(payload.get("thresholds") or {})
    bb_period = next((item["period"] for item in plots if "BB Mid" in item.get("name", "")), pick_mql_period(defaults, ["bb", "band", "bol"], 20))
    rsi_period = next((item["period"] for item in plots if item.get("method") == "rsi" and "Stoch" not in item.get("name", "")), pick_mql_period(defaults, ["rsi"], 14))
    stoch_period = next((item["period"] for item in plots if "Stoch %K" in item.get("name", "")), pick_mql_period(defaults, ["kperiod", "k_period", "stoch"], 5))

    buy_spec = signal_spec_from_conditions(payload.get("conditions") or [], "buy", thresholds, has_bb, has_rsi, has_stoch)
    sell_spec = signal_spec_from_conditions(payload.get("conditions") or [], "sell", thresholds, has_bb, has_rsi, has_stoch)
    buy_spec.update({"bbPeriod": bb_period, "rsiPeriod": rsi_period, "stochPeriod": stoch_period, "bbMult": 2})
    sell_spec.update({"bbPeriod": bb_period, "rsiPeriod": rsi_period, "stochPeriod": stoch_period, "bbMult": 2})

    confluence = has_bb and has_rsi and has_stoch
    has_buy_rule = payload.get("has_buy") or any(item.get("side") == "buy" for item in payload.get("conditions") or [])
    has_sell_rule = payload.get("has_sell") or any(item.get("side") == "sell" for item in payload.get("conditions") or [])
    out: list[dict[str, Any]] = []
    if has_buy_rule or payload.get("has_arrows") or confluence:
        out.append(make_signal_plot("buy", buy_spec, "#00FF66", len(plots)))
    if has_sell_rule or payload.get("has_arrows") or confluence:
        out.append(make_signal_plot("sell", sell_spec, "#FF3366", len(plots) + 1))
    if not out:
        return [], []
    notes = [
        f"Señales Buy/Sell: confluencia "
        f"{'BB ' if buy_spec.get('bb') else ''}"
        f"{'RSI ' if buy_spec.get('rsiValue') is not None else ''}"
        f"{'Stoch' if buy_spec.get('stochValue') is not None else ''}".strip()
        + f" · {len(out)} marcador(es)."
    ]
    return out, notes


def signal_spec_from_conditions(
    conditions: list[dict[str, Any]],
    side: str,
    thresholds: dict[str, Any],
    has_bb: bool,
    has_rsi: bool,
    has_stoch: bool,
) -> dict[str, Any]:
    spec: dict[str, Any] = {"side": side}
    matched = [item for item in conditions if item.get("side") == side]
    rules = [rule for item in matched for rule in (item.get("rules") or [])]
    for rule in rules:
        kind = rule.get("kind")
        op = str(rule.get("op") or "")
        value = rule.get("value")
        if kind in {"bb_lower", "bb_upper"}:
            spec["bb"] = "lower" if "low" in kind else "upper"
        elif kind == "rsi" and value is not None:
            spec["rsiOp"] = "<" if "<" in op else ">"
            spec["rsiValue"] = float(value)
        elif kind == "stoch" and value is not None:
            spec["stochOp"] = "<" if "<" in op else ">"
            spec["stochValue"] = float(value)
    if "bb" not in spec and has_bb:
        spec["bb"] = "lower" if side == "buy" else "upper"
    if spec.get("rsiValue") is None and has_rsi:
        spec["rsiOp"] = "<" if side == "buy" else ">"
        spec["rsiValue"] = float(thresholds.get("rsi_buy" if side == "buy" else "rsi_sell") or (30 if side == "buy" else 70))
    if spec.get("stochValue") is None and has_stoch:
        spec["stochOp"] = "<" if side == "buy" else ">"
        spec["stochValue"] = float(thresholds.get("stoch_buy" if side == "buy" else "stoch_sell") or (20 if side == "buy" else 80))
    return spec


def merge_ai_logic(
    plots: list[dict[str, Any]],
    ir: dict[str, Any],
    ai: dict[str, Any],
) -> tuple[list[dict[str, Any]], list[str]]:
    if ai.get("name"):
        ir["name"] = str(ai["name"])
    existing = {plot["method"]: idx for idx, plot in enumerate(plots) if plot.get("method") in {"signal_buy", "signal_sell"}}
    added = 0
    for item in ai.get("signals") or []:
        side = "buy" if str(item.get("side") or "").lower() in {"buy", "long"} else "sell"
        spec = normalize_ai_spec(item, side)
        color = "#00FF66" if side == "buy" else "#FF3366"
        plot = make_signal_plot(side, spec, color, len(plots) + added)
        if item.get("label"):
            plot["name"] = str(item["label"])[:24]
        key = "signal_buy" if side == "buy" else "signal_sell"
        if key in existing:
            plots[existing[key]] = plot
        else:
            plots.append(plot)
            existing[key] = len(plots) - 1
            added += 1
    notes = ["Capa IA: condiciones, cruces y flechas traducidos a signalBuy/signalSell + primitivas ECharts."]
    notes.extend(str(item) for item in ai.get("notes") or [])
    return plots, notes


def normalize_ai_spec(item: dict[str, Any], side: str) -> dict[str, Any]:
    spec: dict[str, Any] = {"side": side}
    if item.get("bb") in {"lower", "upper"}:
        spec["bb"] = item["bb"]
    for key in ("bbPeriod", "rsiPeriod", "stochPeriod"):
        if item.get(key) is not None:
            try:
                spec[key] = int(float(item[key]))
            except (TypeError, ValueError):
                pass
    for key in ("bbMult", "rsiValue", "stochValue"):
        if item.get(key) is not None:
            try:
                spec[key] = float(item[key])
            except (TypeError, ValueError):
                pass
    if item.get("rsiOp") in {"<", ">"}:
        spec["rsiOp"] = item["rsiOp"]
    if item.get("stochOp") in {"<", ">"}:
        spec["stochOp"] = item["stochOp"]
    if item.get("label"):
        spec["label"] = str(item["label"])
    return spec


def enrich_echarts(
    echarts: dict[str, Any],
    plots: list[dict[str, Any]],
    ai: Optional[dict[str, Any]],
) -> dict[str, Any]:
    echarts.setdefault("markLines", [])
    echarts.setdefault("markAreas", [])
    echarts.setdefault("markPoints", [])
    echarts.setdefault("graphic", [])
    echarts.setdefault("primitives", [])
    for plot in plots:
        if plot.get("method") not in {"signal_buy", "signal_sell"}:
            continue
        side = "buy" if plot["method"] == "signal_buy" else "sell"
        echarts["primitives"].append(
            {
                "type": plot["method"],
                "name": plot["name"],
                "color": plot["color"],
                "source": plot.get("signal"),
            }
        )
        echarts["markPoints"].append(
            {
                "name": plot["name"],
                "symbol": "arrow",
                "symbolRotate": 0 if side == "buy" else 180,
                "symbolSize": 16,
                "itemStyle": {"color": plot["color"]},
                "label": {
                    "show": True,
                    "formatter": plot["name"],
                    "color": plot["color"],
                    "fontSize": 10,
                    "position": "bottom" if side == "buy" else "top",
                },
                "side": side,
            }
        )
    if not ai:
        return echarts
    for line in ai.get("lines") or []:
        try:
            y_axis = float(line["y"])
        except (KeyError, TypeError, ValueError):
            continue
        echarts["markLines"].append(
            {
                "name": line.get("name") or "Nivel",
                "yAxis": y_axis,
                "lineStyle": {
                    "color": line.get("color") or "#a1a1aa",
                    "type": line.get("style") or "dashed",
                    "width": 1.2,
                },
                "label": {"formatter": line.get("name") or "", "position": "end"},
            }
        )
    for zone in ai.get("zones") or []:
        try:
            y0 = float(zone["y0"])
            y1 = float(zone["y1"])
        except (KeyError, TypeError, ValueError):
            continue
        color = str(zone.get("color") or "rgba(0,229,255,0.12)")
        echarts["markAreas"].append(
            [
                {
                    "name": zone.get("name") or "Zona",
                    "yAxis": y0,
                    "itemStyle": {"color": color},
                },
                {"yAxis": y1},
            ]
        )
    for idx, label in enumerate(ai.get("labels") or []):
        text = str(label.get("text") or label.get("name") or "").strip()
        if not text:
            continue
        echarts["graphic"].append(
            {
                "type": "text",
                "silent": True,
                "z": 100,
                "right": 18,
                "top": 14 + idx * 18,
                "style": {
                    "text": text,
                    "fill": label.get("color") or "#e4e4e7",
                    "font": "11px ui-monospace, monospace",
                },
            }
        )
    return echarts


def make_signal_plot(side: str, spec: dict[str, Any], color: str, index: int) -> dict[str, Any]:
    method = "signal_buy" if side == "buy" else "signal_sell"
    return {
        "id": f"bi-py-{index}-{method}",
        "name": "BUY" if side == "buy" else "SELL",
        "enabled": True,
        "source": "low" if side == "buy" else "high",
        "method": method,
        "period": 1,
        "color": color,
        "width": 1.4,
        "pane": "overlay",
        "signal": spec,
    }


def normalize_pine_visuals(raw: list[dict[str, Any]]) -> list[dict[str, Any]]:
    visuals = []
    for item in raw:
        kind = item.get("type")
        if kind == "plot":
            visuals.append({"kind": "plot", "expression": item.get("expression") or "", "raw": item})
            continue
        if kind == "hline":
            visuals.append(
                {
                    "kind": "hline",
                    "name": "HLine",
                    "color": parse_color(str(item.get("expression") or "")) or "#a1a1aa",
                    "raw": item,
                }
            )
            continue
        fn = str(item.get("function") or "")
        mapped = "trendline" if fn.startswith("line.") else "pattern_box" if fn.startswith("box.") else "label"
        color = "#10B981" if mapped == "trendline" else "#A78BFA"
        visuals.append({"kind": mapped, "name": fn, "color": color, "raw": item})
    return visuals


def normalize_mql_visuals(raw: list[dict[str, Any]]) -> list[dict[str, Any]]:
    visuals = []
    for item in raw:
        args = str(item.get("arguments") or "").upper()
        if "OBJ_HLINE" in args or "OBJ_PRICE" in args:
            kind, color, name = "hline", "#EF4444", "HLine"
        elif "OBJ_TREND" in args or "OBJ_CHANNEL" in args:
            kind, color, name = "trendline", "#10B981", "Trend"
        elif "OBJ_RECTANGLE" in args or "OBJ_FIBO" in args:
            kind, color, name = "pattern_box", "#A78BFA", "Zone"
        else:
            kind, color, name = "trendline", "#00E5FF", "ObjectCreate"
        if "SUPPORT" in args or "LOW" in args:
            kind, color = "support", "#10B981"
        if "RESIST" in args or "HIGH" in args:
            kind, color = "resistance", "#EF4444"
        visuals.append({"kind": kind, "name": name, "color": color, "raw": item})
    return visuals


def is_signal_expr(expr: str, aliases: dict[str, dict[str, Any]]) -> bool:
    token = expr.strip()
    if token in aliases:
        return str(aliases[token].get("function") or "").lower() in SIGNAL_FUNCTIONS
    key = token.lower()
    return any(name in key for name in SIGNAL_FUNCTIONS) or key.startswith("ta.cross")


def map_expression(
    expr: str,
    aliases: dict[str, dict[str, Any]],
    defaults: dict[str, Any],
    overlay: bool,
) -> Optional[tuple[str, str, int, str]]:
    token = expr.strip()
    if not token or is_signal_expr(token, aliases):
        return None
    if token in aliases:
        mapped = map_ta_call(aliases[token], defaults, overlay)
        return mapped[0] if mapped else None
    nested = re.search(r"(ta\.\w+)\s*\((.*)\)\s*$", token, re.I | re.S)
    if nested:
        mapped = map_ta_call(
            {"function": nested.group(1), "args": split_args(nested.group(2))},
            defaults,
            overlay,
        )
        return mapped[0] if mapped else None
    call = re.match(r"(?:ta\.)?(\w+)\s*\((.*)\)$", token, re.I | re.S)
    if call:
        mapped = map_ta_call(
            {"function": f"ta.{call.group(1).lower()}", "args": split_args(call.group(2))},
            defaults,
            overlay,
        )
        return mapped[0] if mapped else None
    for name, row in aliases.items():
        if re.search(rf"\b{re.escape(name)}\b", token):
            mapped = map_ta_call(row, defaults, overlay)
            if mapped:
                return mapped[0]
    source = as_source(token)
    if source != "close" or token.lower() in {"close", "ohlc4"}:
        return "raw", source, 1, "overlay"
    return None


def map_ta_call(row: dict[str, Any], defaults: dict[str, Any], overlay: bool) -> list[tuple[str, str, int, str]]:
    fn = str(row.get("function") or "")
    args = list(row.get("args") or [])
    key = fn.lower()
    if key in SIGNAL_FUNCTIONS:
        return []
    if key.startswith("ta."):
        method = PINE_TA_MAP.get(key)
        if method is None:
            src = as_source(args[0] if args else "close")
            period = as_number(args[1] if len(args) > 1 else args[0] if args else "14", defaults, 14)
            return [("ema" if "ma" in key or "avg" in key else "sma", src, period, "overlay" if overlay else "pane")]
        if method == "atr":
            period = as_number(args[0] if args else "14", defaults, 14)
            return [(method, "close", period, "overlay" if overlay else "pane")]
        if key == "ta.macd":
            fast = as_number(args[1] if len(args) > 1 else "12", defaults, 12)
            slow = as_number(args[2] if len(args) > 2 else "26", defaults, 26)
            return [
                ("ema", as_source(args[0] if args else "close"), fast, "pane"),
                ("ema", as_source(args[0] if args else "close"), slow, "pane"),
            ]
        if key == "ta.bb":
            period = as_number(args[1] if len(args) > 1 else "20", defaults, 20)
            src = as_source(args[0] if args else "close")
            return [("sma", src, period, "overlay"), ("stddev", src, period, "overlay")]
        src = as_source(args[0] if args else "close")
        period = as_number(args[1] if len(args) > 1 else args[0] if args else "14", defaults, 14)
        pane = "pane" if method in PANE_METHODS else ("overlay" if overlay else "pane")
        if method == "raw":
            return [("raw", src, 1, "overlay")]
        return [(method, src, period, pane)]

    return map_mql_call(fn, args, defaults, overlay)


def map_mql_call(fn: str, args: list[str], defaults: dict[str, Any], overlay: bool) -> list[tuple[str, str, int, str]]:
    key = fn.lower()
    pane = "overlay" if overlay else "pane"
    if key in {"ima", "imaonarray"}:
        period = as_number(args[2] if len(args) > 2 else "21", defaults, 21)
        mode = (args[4] if len(args) > 4 else args[3] if len(args) > 3 else "").upper()
        price = args[5] if len(args) > 5 else args[-1] if args else "PRICE_CLOSE"
        method = "sma" if "SMA" in mode else "ema"
        return [(method, mql_price(price), period, pane)]
    if key == "irsi":
        return [("rsi", mql_price(args[3] if len(args) > 3 else "PRICE_CLOSE"), as_number(args[2] if len(args) > 2 else "14", defaults, 14), "pane")]
    if key == "iatr":
        return [("atr", "close", as_number(args[2] if len(args) > 2 else "14", defaults, 14), pane)]
    if key == "istddev":
        return [("stddev", mql_price(args[-1] if args else "PRICE_CLOSE"), as_number(args[2] if len(args) > 2 else "20", defaults, 20), "pane")]
    if key == "imomentum":
        return [("roc", mql_price(args[3] if len(args) > 3 else "PRICE_CLOSE"), as_number(args[2] if len(args) > 2 else "12", defaults, 12), "pane")]
    if key == "ibands":
        period = as_number(args[2] if len(args) > 2 else "20", defaults, 20)
        return [("sma", "close", period, "overlay"), ("stddev", "close", period, "overlay")]
    if key == "imacd":
        return [
            ("ema", "close", as_number(args[2] if len(args) > 2 else "12", defaults, 12), "pane"),
            ("ema", "close", as_number(args[3] if len(args) > 3 else "26", defaults, 26), "pane"),
        ]
    if key == "istochastic":
        return [("rsi", "close", as_number(args[2] if len(args) > 2 else "14", defaults, 14), "pane")]
    if key == "ienvelopes":
        return [("ema", "close", as_number(args[2] if len(args) > 2 else "14", defaults, 14), "overlay")]
    if key == "icci":
        return [("sma", "hlc3", as_number(args[2] if len(args) > 2 else "20", defaults, 20), "pane")]
    if key == "iwpr":
        return [("roc", "close", as_number(args[2] if len(args) > 2 else "14", defaults, 14), "pane")]
    return []


def push_plot(
    plots: list[dict[str, Any]],
    seen: set[str],
    method: str,
    source: str,
    period: int,
    pane: str,
    title: str,
    color: str,
    index: int,
) -> None:
    key = f"{method}-{source}-{period}-{pane}"
    if key in seen:
        return
    seen.add(key)
    plots.append(make_plot(method, source, period, pane, title, color, index))


def make_plot(method: str, source: str, period: int, pane: str, name: str, color: str, index: int) -> dict[str, Any]:
    return {
        "id": f"bi-py-{index}-{method}-{period}",
        "name": name,
        "enabled": True,
        "source": source,
        "method": method,
        "period": max(1, int(period)),
        "color": color,
        "width": 1.4,
        "pane": pane,
    }


def default_name(method: str, period: int, source: str) -> str:
    if method == "raw":
        return source.upper()
    if method == "atr":
        return f"ATR {period}"
    return f"{method.upper()} {period} {source}"


def split_args(raw: str) -> list[str]:
    args: list[str] = []
    buf: list[str] = []
    depth = 0
    quote = ""
    for ch in raw:
        if quote:
            buf.append(ch)
            if ch == quote:
                quote = ""
            continue
        if ch in {'"', "'"}:
            quote = ch
            buf.append(ch)
            continue
        if ch == "(":
            depth += 1
            buf.append(ch)
            continue
        if ch == ")":
            depth = max(0, depth - 1)
            buf.append(ch)
            continue
        if ch == "," and depth == 0:
            token = "".join(buf).strip()
            if token:
                args.append(token)
            buf = []
            continue
        buf.append(ch)
    token = "".join(buf).strip()
    if token:
        args.append(token)
    return args


def as_number(raw: Any, defaults: dict[str, Any], fallback: int) -> int:
    token = str(raw or "").strip()
    if token in defaults and defaults[token] is not None:
        return int(defaults[token])
    for key, value in defaults.items():
        if key.lower() == token.lower() and value is not None:
            return int(value)
    match = re.search(r"-?\d+", token)
    return int(match.group(0)) if match else fallback


def first_number(raw: str) -> Optional[int]:
    match = re.search(r"-?\d+", raw)
    return int(match.group(0)) if match else None


def as_source(raw: str) -> str:
    token = re.sub(r"[^a-z0-9]", "", (raw or "").lower())
    if token in {"open", "high", "low", "hl2", "hlc3", "volume"}:
        return token
    if token in {"ohlc4"}:
        return "hl2"
    if token in {"vol"}:
        return "volume"
    return "close"


def mql_price(raw: str) -> str:
    token = (raw or "").upper()
    if "OPEN" in token:
        return "open"
    if "HIGH" in token:
        return "high"
    if "LOW" in token and "HL" not in token:
        return "low"
    if "TYPICAL" in token or "HLCC" in token:
        return "hlc3"
    if "MEDIAN" in token or "HL2" in token:
        return "hl2"
    return "close"


def parse_color(raw: str) -> Optional[str]:
    hex_hit = re.search(r"#([0-9A-Fa-f]{6})", raw or "")
    if hex_hit:
        return f"#{hex_hit.group(1)}"
    named = re.search(r"color\.([a-z]+)", raw or "", re.I)
    if named and named.group(1).lower() in PINE_COLORS:
        return PINE_COLORS[named.group(1).lower()]
    return None


def extract_title(raw: str) -> Optional[str]:
    hit = re.search(r'title\s*=\s*("([^"]+)"|\'([^\']+)\')', raw or "", re.I)
    if hit:
        return hit.group(2) or hit.group(3)
    return None


def extract_quoted(source: str, pattern: str) -> Optional[str]:
    hit = re.search(pattern, source)
    if not hit:
        return None
    if hit.lastindex and hit.lastindex >= 2:
        return hit.group(2).strip()
    return hit.group(1).strip()


def strip_quotes(value: str) -> str:
    return (value or "").strip().strip('"').strip("'")

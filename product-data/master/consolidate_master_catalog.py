#!/usr/bin/env python3
"""Build the reviewed Enjoyful Life master catalog workbook.

The source workbooks are never modified. Matching is deterministic and favors:
1. SKU/part number (when the online sheet supplies one),
2. normalized full product name,
3. documented naming aliases and unique base-name matches.
"""

from __future__ import annotations

import json
import math
import re
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

from openpyxl import Workbook, load_workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter


HERE = Path(__file__).resolve().parent
MASTER_PATH = HERE / "enJoyful_Master_Catalog.xlsx"
ONLINE_PATH = HERE / "Enjoyful_Life_Online_Price_List.xlsx"
IMAGE_URLS_PATH = HERE / "image-urls.json"
OUTPUT_PATH = HERE / "Enjoyful_Master_Catalog_Updated.xlsx"

MASTER_SHEET = "Sheet1"
ONLINE_SHEET = "Online Price List"

REMOVED_MASTER_COLUMNS = {
    "source",
    "slug",
    "family",
    "cloudinary public id",
    "flags",
}

BRAND = "Enjoyful Life"


NAVY = "17365D"
BLUE = "2F75B5"
LIGHT_BLUE = "D9EAF7"
VERY_LIGHT_BLUE = "F4F8FC"
WHITE = "FFFFFF"
TEXT = "243447"
GRID = "D9E2F3"
GREEN = "E2F0D9"
GREEN_TEXT = "375623"
YELLOW = "FFF2CC"
YELLOW_TEXT = "7F6000"
RED = "FCE4D6"
RED_TEXT = "9C0006"
GREY = "E7E6E6"

CATEGORY_COLORS = {
    "Baby": "E2F0D9",
    "Daily": "D9EAF7",
    "Fragrances": "E4DFEC",
    "Glow": "FCE4D6",
    "Home Care": "FFF2CC",
}


def text(value: Any) -> str:
    return "" if value is None else str(value).strip()


def catalog_product_name(value: Any) -> str:
    """Remove the repeated brand prefix to match the Master Catalog naming style."""
    return re.sub(r"^\s*enjoyful\s*life\s*", "", text(value), flags=re.IGNORECASE).strip()


def normalized_words(value: Any) -> str:
    """Normalize casing, spacing, punctuation, brand prefix, and known labels."""
    value = unicodedata.normalize("NFKD", text(value)).encode("ascii", "ignore").decode()
    value = value.lower().replace("&", " and ")
    value = re.sub(r"^\s*enjoyful\s*life\s*", "", value)
    value = re.sub(r"[^a-z0-9.]+", " ", value)
    words = value.split()
    aliases = {"primium": "premium", "talc": "powder"}
    words = [aliases.get(word, word) for word in words]
    # These transformations are documented in the source catalog README.
    words = [word for word in words if word not in {"fragrances", "handwash"}]
    return " ".join(words)


def full_name_key(value: Any) -> str:
    return re.sub(r"[^a-z0-9]+", "", normalized_words(value))


def base_name_key(value: Any) -> str:
    words = normalized_words(value)
    words = re.sub(
        r"\b\d+(?:\.\d+)?\s*(?:ml|gm|g|kg|l|ltr|litre|liter)\b", " ", words
    )
    return re.sub(r"[^a-z0-9]+", "", words)


def sku_key(value: Any) -> str:
    return re.sub(r"[^a-z0-9]+", "", text(value).lower())


def is_blank(value: Any) -> bool:
    return value is None or (isinstance(value, str) and not value.strip())


def numeric_price(value: Any) -> float | None:
    if is_blank(value):
        return None
    if isinstance(value, bool):
        return float(value)
    if isinstance(value, (int, float)):
        if isinstance(value, float) and math.isnan(value):
            return None
        return float(value)
    cleaned = re.sub(r"[^0-9.\-]", "", str(value))
    if not cleaned or cleaned in {"-", ".", "-."}:
        return None
    try:
        return float(cleaned)
    except ValueError:
        return None


def read_records(path: Path, sheet: str) -> tuple[list[str], list[dict[str, Any]]]:
    ws = load_workbook(path, data_only=True, read_only=True)[sheet]
    headers = [text(cell.value) for cell in ws[1]]
    records: list[dict[str, Any]] = []
    for row_number, values in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
        if not any(not is_blank(value) for value in values):
            continue
        record = {header: value for header, value in zip(headers, values)}
        record["__source_row__"] = row_number
        records.append(record)
    return headers, records


def find_header(headers: list[str], candidates: set[str]) -> str | None:
    for header in headers:
        key = re.sub(r"[^a-z0-9]+", " ", header.lower()).strip()
        if key in candidates:
            return header
    return None


def match_catalogs(
    master_headers: list[str],
    masters: list[dict[str, Any]],
    online_headers: list[str],
    online: list[dict[str, Any]],
) -> tuple[dict[int, int], dict[int, str], set[int]]:
    master_sku_header = find_header(
        master_headers, {"sku", "code sku", "part number", "sku part number"}
    )
    online_sku_header = find_header(
        online_headers, {"sku", "code sku", "part number", "sku part number"}
    )
    master_name_header = find_header(master_headers, {"product name", "name"})
    online_name_header = find_header(online_headers, {"product name", "name"})
    if not master_name_header or not online_name_header:
        raise ValueError("Both source workbooks must contain a Product Name column")

    matched: dict[int, int] = {}
    methods: dict[int, str] = {}
    used_online: set[int] = set()

    def unique_index(key_fn, header: str, only_unused: bool = True):
        index: dict[str, list[int]] = defaultdict(list)
        for oi, item in enumerate(online):
            if only_unused and oi in used_online:
                continue
            key = key_fn(item.get(header))
            if key:
                index[key].append(oi)
        return index

    def assign(mi: int, oi: int, method: str, consume: bool = True) -> None:
        matched[mi] = oi
        methods[mi] = method
        if consume:
            used_online.add(oi)

    # 1. SKU / part number when supplied by both workbooks.
    if master_sku_header and online_sku_header:
        index = unique_index(sku_key, online_sku_header)
        for mi, item in enumerate(masters):
            candidates = index.get(sku_key(item.get(master_sku_header)), [])
            if len(candidates) == 1:
                assign(mi, candidates[0], "SKU")

    # 2. Normalized full product name, including documented naming aliases.
    index = unique_index(full_name_key, online_name_header)
    for mi, item in enumerate(masters):
        if mi in matched:
            continue
        candidates = index.get(full_name_key(item.get(master_name_header)), [])
        if len(candidates) == 1 and candidates[0] not in used_online:
            assign(mi, candidates[0], "Normalized product name")

    # 3. A generic online product can represent named scent variants at the same size.
    # This is intentionally narrow and is used for the two toilet-cleaner variants.
    all_full_index = unique_index(full_name_key, online_name_header, only_unused=False)
    for mi, item in enumerate(masters):
        if mi in matched or is_blank(item.get("Scent/Variant")):
            continue
        product_name = normalized_words(item.get(master_name_header))
        variant_tokens = normalized_words(item.get("Scent/Variant")).split()
        reduced = product_name
        for token in variant_tokens:
            reduced = re.sub(rf"\b{re.escape(token)}\b", " ", reduced)
        # Also remove the short scent token embedded in names such as "Aqua".
        if variant_tokens:
            reduced = re.sub(rf"\b{re.escape(variant_tokens[0])}\b", " ", reduced)
        reduced_key = full_name_key(reduced)
        candidates = all_full_index.get(reduced_key, [])
        if len(candidates) == 1:
            assign(mi, candidates[0], "Generic online variant", consume=True)

    # Allow another master scent variant to share an already matched generic row.
    for mi, item in enumerate(masters):
        if mi in matched or is_blank(item.get("Scent/Variant")):
            continue
        product_name = normalized_words(item.get(master_name_header))
        variant_tokens = normalized_words(item.get("Scent/Variant")).split()
        reduced = product_name
        for token in variant_tokens:
            reduced = re.sub(rf"\b{re.escape(token)}\b", " ", reduced)
        if variant_tokens:
            reduced = re.sub(rf"\b{re.escape(variant_tokens[0])}\b", " ", reduced)
        candidates = all_full_index.get(full_name_key(reduced), [])
        if len(candidates) == 1 and candidates[0] in used_online:
            assign(mi, candidates[0], "Generic online variant (shared)", consume=False)

    # 4. Unique base-name match for clear pack-size corrections in the online list.
    index = unique_index(base_name_key, online_name_header)
    unmatched_master_base_counts = Counter(
        base_name_key(item.get(master_name_header))
        for mi, item in enumerate(masters)
        if mi not in matched
    )
    for mi, item in enumerate(masters):
        if mi in matched:
            continue
        key = base_name_key(item.get(master_name_header))
        candidates = index.get(key, [])
        if key and unmatched_master_base_counts[key] == 1 and len(candidates) == 1:
            assign(mi, candidates[0], "Unique base product name")

    return matched, methods, used_online


def price_status(existing: Any, online: Any) -> str:
    online_value = numeric_price(online)
    if online_value is None:
        return "Missing Online Price"
    existing_value = numeric_price(existing)
    if existing_value is not None and math.isclose(existing_value, online_value, abs_tol=0.005):
        return "Same"
    return "Changed"


def display_price(value: Any) -> float | None:
    return numeric_price(value)


def has_image(slug: Any, image_urls: dict[str, Any]) -> bool:
    entry = image_urls.get(text(slug))
    if not isinstance(entry, dict):
        return False
    if text(entry.get("image")):
        return True
    images = entry.get("images")
    return isinstance(images, list) and any(
        isinstance(image, dict) and text(image.get("url")) for image in images
    )


def add_data_sheet(
    wb: Workbook,
    title: str,
    headers: list[str],
    rows: list[dict[str, Any]],
    *,
    category_view: bool = False,
) -> None:
    ws = wb.create_sheet(title)
    ws.sheet_view.showGridLines = False
    ws.freeze_panes = "A2"
    ws.auto_filter.ref = f"A1:{get_column_letter(len(headers))}{len(rows) + 1}"
    ws.sheet_properties.pageSetUpPr.fitToPage = True
    ws.page_setup.orientation = "landscape"
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0
    ws.print_title_rows = "1:1"
    ws.sheet_properties.tabColor = BLUE if not category_view else "70AD47"

    thin = Side(style="thin", color=GRID)
    for column, header in enumerate(headers, start=1):
        cell = ws.cell(1, column, header)
        cell.font = Font(name="Calibri", size=11, bold=True, color=WHITE)
        cell.fill = PatternFill("solid", fgColor=NAVY)
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = Border(bottom=Side(style="medium", color=BLUE))
    ws.row_dimensions[1].height = 32

    price_columns = {"Price AED", "Online Price"}
    for row_number, record in enumerate(rows, start=2):
        status = record.get("Price Status")
        row_fill = YELLOW if status == "Changed" else (VERY_LIGHT_BLUE if row_number % 2 == 0 else WHITE)
        for column, header in enumerate(headers, start=1):
            value = record.get(header)
            if header in price_columns:
                value = display_price(value)
            cell = ws.cell(row_number, column, value)
            cell.font = Font(name="Calibri", size=10, color=TEXT)
            cell.fill = PatternFill("solid", fgColor=row_fill)
            cell.border = Border(bottom=thin)
            cell.alignment = Alignment(vertical="top", wrap_text=True)
            if header in price_columns:
                cell.number_format = '"AED" #,##0.00'
                cell.alignment = Alignment(horizontal="right", vertical="top")
            elif header == "#":
                cell.alignment = Alignment(horizontal="center", vertical="top")

        status_column = headers.index("Price Status") + 1
        image_column = headers.index("Image Status") + 1
        category_column = headers.index("Category") + 1
        status_cell = ws.cell(row_number, status_column)
        image_cell = ws.cell(row_number, image_column)
        category_cell = ws.cell(row_number, category_column)

        status_style = {
            "Same": (GREEN, GREEN_TEXT),
            "Changed": (YELLOW, YELLOW_TEXT),
            "Missing Online Price": (RED, RED_TEXT),
        }[text(status_cell.value)]
        status_cell.fill = PatternFill("solid", fgColor=status_style[0])
        status_cell.font = Font(name="Calibri", size=10, bold=True, color=status_style[1])
        status_cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)

        if image_cell.value == "Has Image":
            image_cell.fill = PatternFill("solid", fgColor=GREEN)
            image_cell.font = Font(name="Calibri", size=10, bold=True, color=GREEN_TEXT)
        else:
            image_cell.fill = PatternFill("solid", fgColor=RED)
            image_cell.font = Font(name="Calibri", size=10, bold=True, color=RED_TEXT)
        image_cell.alignment = Alignment(horizontal="center", vertical="center")

        if category_view:
            category = text(category_cell.value)
            category_cell.fill = PatternFill("solid", fgColor=CATEGORY_COLORS.get(category, GREY))
            category_cell.font = Font(name="Calibri", size=10, bold=True, color=TEXT)

        ws.row_dimensions[row_number].height = 42

    widths = {
        "#": 7,
        "Code/SKU": 18,
        "Product Name": 38,
        "Base Name": 31,
        "Category": 16,
        "Subcategory": 23,
        "Size": 12,
        "Unit Type": 14,
        "Scent/Variant": 22,
        "Price AED": 16,
        "Online Price": 17,
        "Price Status": 22,
        "Image Status": 18,
        "Short Description": 48,
        "Key Features": 52,
        "Ingredients (INCI)": 60,
        "Benefits": 55,
    }
    for column, header in enumerate(headers, start=1):
        ws.column_dimensions[get_column_letter(column)].width = widths.get(header, 18)


def add_removed_sheet(wb: Workbook, removed: list[dict[str, Any]]) -> None:
    headers = ["Product Name", "Category", "SKU / Part Number", "Brand", "Reason"]
    ws = wb.create_sheet("Removed Products")
    ws.sheet_view.showGridLines = False
    ws.freeze_panes = "A2"
    ws.auto_filter.ref = f"A1:E{len(removed) + 1}"
    ws.sheet_properties.tabColor = "C00000"
    ws.sheet_properties.pageSetUpPr.fitToPage = True
    ws.page_setup.orientation = "landscape"
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 1
    ws.print_title_rows = "1:1"
    for column, header in enumerate(headers, start=1):
        cell = ws.cell(1, column, header)
        cell.font = Font(name="Calibri", size=11, bold=True, color=WHITE)
        cell.fill = PatternFill("solid", fgColor=NAVY)
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    ws.row_dimensions[1].height = 32
    for row_number, record in enumerate(removed, start=2):
        values = [
            record.get("Product Name"),
            record.get("Category"),
            record.get("Code/SKU"),
            BRAND,
            "Not found in Online Price List",
        ]
        for column, value in enumerate(values, start=1):
            cell = ws.cell(row_number, column, value)
            cell.font = Font(name="Calibri", size=10, color=TEXT)
            cell.fill = PatternFill("solid", fgColor=RED if column == 5 else (VERY_LIGHT_BLUE if row_number % 2 == 0 else WHITE))
            cell.alignment = Alignment(vertical="top", wrap_text=True)
            cell.border = Border(bottom=Side(style="thin", color=GRID))
        ws.row_dimensions[row_number].height = 30
    for column, width in enumerate([38, 18, 22, 18, 34], start=1):
        ws.column_dimensions[get_column_letter(column)].width = width


def add_latest_products_sheet(wb: Workbook, rows: list[dict[str, Any]]) -> None:
    headers = ["Product Name", "Category", "Subcategory", "Online Price"]
    ws = wb.create_sheet("Latest Products")
    ws.sheet_view.showGridLines = False
    ws.freeze_panes = "A2"
    ws.auto_filter.ref = f"A1:D{len(rows) + 1}"
    ws.sheet_properties.tabColor = "00B0F0"
    ws.sheet_properties.pageSetUpPr.fitToPage = True
    ws.page_setup.orientation = "landscape"
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0
    ws.print_title_rows = "1:1"

    for column, header in enumerate(headers, start=1):
        cell = ws.cell(1, column, header)
        cell.font = Font(name="Calibri", size=11, bold=True, color=WHITE)
        cell.fill = PatternFill("solid", fgColor=NAVY)
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = Border(bottom=Side(style="medium", color=BLUE))
    ws.row_dimensions[1].height = 32

    for row_number, record in enumerate(rows, start=2):
        values = [
            record.get("Product Name"),
            record.get("Category"),
            record.get("Subcategory"),
            display_price(record.get("Online Price")),
        ]
        base_fill = VERY_LIGHT_BLUE if row_number % 2 == 0 else WHITE
        for column, value in enumerate(values, start=1):
            cell = ws.cell(row_number, column, value)
            cell.font = Font(name="Calibri", size=10, color=TEXT)
            cell.fill = PatternFill("solid", fgColor=base_fill)
            cell.border = Border(bottom=Side(style="thin", color=GRID))
            cell.alignment = Alignment(vertical="center", wrap_text=True)
        category = text(record.get("Category"))
        category_cell = ws.cell(row_number, 2)
        category_cell.fill = PatternFill("solid", fgColor=CATEGORY_COLORS.get(category, GREY))
        category_cell.font = Font(name="Calibri", size=10, bold=True, color=TEXT)
        price_cell = ws.cell(row_number, 4)
        price_cell.number_format = '"AED" #,##0.00'
        price_cell.alignment = Alignment(horizontal="right", vertical="center")
        if price_cell.value is None:
            price_cell.fill = PatternFill("solid", fgColor=RED)
        ws.row_dimensions[row_number].height = 27

    for column, width in enumerate([42, 20, 28, 18], start=1):
        ws.column_dimensions[get_column_letter(column)].width = width


def add_readme(wb: Workbook, summary: dict[str, int]) -> None:
    ws = wb.active
    ws.title = "README"
    ws.sheet_view.showGridLines = False
    ws.sheet_properties.tabColor = NAVY
    ws.column_dimensions["A"].width = 38
    ws.column_dimensions["B"].width = 24
    ws.column_dimensions["C"].width = 24
    ws.column_dimensions["D"].width = 24

    ws.merge_cells("A1:D1")
    title = ws["A1"]
    title.value = "Enjoyful Life — Updated Master Catalog"
    title.font = Font(name="Calibri", size=18, bold=True, color=WHITE)
    title.fill = PatternFill("solid", fgColor=NAVY)
    title.alignment = Alignment(horizontal="left", vertical="center")
    ws.row_dimensions[1].height = 42
    for cell in ws[1][1:]:
        cell.fill = PatternFill("solid", fgColor=NAVY)

    ws.merge_cells("A3:B3")
    ws["A3"] = "Catalog Summary"
    ws["A3"].font = Font(name="Calibri", size=13, bold=True, color=WHITE)
    ws["A3"].fill = PatternFill("solid", fgColor=BLUE)
    ws["A3"].alignment = Alignment(vertical="center")
    ws["B3"].fill = PatternFill("solid", fgColor=BLUE)

    labels = [
        ("Total products in original Master Catalog", "original"),
        ("Total products in Online Price List", "online"),
        ("Total products in new Master Catalog", "new"),
        ("Removed products count", "removed"),
        ("Products with images", "with_images"),
        ("Products missing images", "missing_images"),
        ("Products with changed prices", "changed_prices"),
        ("Products missing online prices", "missing_online_prices"),
    ]
    for row_number, (label, key) in enumerate(labels, start=4):
        ws.cell(row_number, 1, label)
        ws.cell(row_number, 2, summary[key])
        for column in (1, 2):
            cell = ws.cell(row_number, column)
            cell.font = Font(name="Calibri", size=11, bold=(column == 2), color=TEXT)
            cell.fill = PatternFill("solid", fgColor=VERY_LIGHT_BLUE if row_number % 2 == 0 else WHITE)
            cell.border = Border(bottom=Side(style="thin", color=GRID))
            cell.alignment = Alignment(vertical="center")
        ws.cell(row_number, 2).alignment = Alignment(horizontal="center", vertical="center")
        ws.row_dimensions[row_number].height = 24

    ws.merge_cells("A13:D13")
    ws["A13"] = "Review Note"
    ws["A13"].font = Font(name="Calibri", size=12, bold=True, color=WHITE)
    ws["A13"].fill = PatternFill("solid", fgColor=BLUE)
    for cell in ws[13][1:]:
        cell.fill = PatternFill("solid", fgColor=BLUE)

    ws.merge_cells("A14:D16")
    ws["A14"] = (
        "This workbook is the updated master catalog created by comparing the existing "
        "Master Catalog with the current Online Price List. Removed products have been "
        "excluded from the new catalog and listed separately. Products found only in the "
        "Online Price List have been added with Product Name and Online Price only; the "
        "remaining fields must be completed by the client/team. Please review the Category "
        "View sheet to complete missing information, verify prices, and provide missing images. "
        "The Latest Products sheet provides a compact product and online-price view."
    )
    ws["A14"].font = Font(name="Calibri", size=11, color=TEXT)
    ws["A14"].fill = PatternFill("solid", fgColor=VERY_LIGHT_BLUE)
    ws["A14"].alignment = Alignment(vertical="top", wrap_text=True)
    ws["A14"].border = Border(
        left=Side(style="thin", color=GRID),
        right=Side(style="thin", color=GRID),
        top=Side(style="thin", color=GRID),
        bottom=Side(style="thin", color=GRID),
    )

    ws.merge_cells("A18:D18")
    ws["A18"] = "Color Guide"
    ws["A18"].font = Font(name="Calibri", size=12, bold=True, color=WHITE)
    ws["A18"].fill = PatternFill("solid", fgColor=BLUE)
    for cell in ws[18][1:]:
        cell.fill = PatternFill("solid", fgColor=BLUE)
    guide = [
        ("Changed price row", YELLOW),
        ("Missing online price / missing image", RED),
        ("Verified same price / image available", GREEN),
    ]
    for row_number, (label, color) in enumerate(guide, start=19):
        ws.cell(row_number, 1, label)
        ws.cell(row_number, 2, " ")
        ws.cell(row_number, 1).font = Font(name="Calibri", size=10, color=TEXT)
        ws.cell(row_number, 2).fill = PatternFill("solid", fgColor=color)
        ws.cell(row_number, 1).border = Border(bottom=Side(style="thin", color=GRID))
        ws.cell(row_number, 2).border = Border(bottom=Side(style="thin", color=GRID))

    ws.freeze_panes = "A3"
    ws.page_setup.orientation = "portrait"
    ws.page_setup.fitToWidth = 1
    ws.sheet_properties.pageSetUpPr.fitToPage = True


def validate_output(path: Path, expected_rows: int, expected_removed: int) -> None:
    wb = load_workbook(path, data_only=False)
    expected_sheets = [
        "README",
        "Master Catalog (Updated)",
        "Category View",
        "Latest Products",
        "Removed Products",
    ]
    if wb.sheetnames != expected_sheets:
        raise AssertionError(f"Unexpected sheet structure: {wb.sheetnames}")
    master = wb["Master Catalog (Updated)"]
    category = wb["Category View"]
    latest = wb["Latest Products"]
    removed = wb["Removed Products"]
    headers = [cell.value for cell in master[1]]
    for forbidden in ("Source", "Slug", "Family", "Cloudinary Public ID", "Flags"):
        if forbidden in headers:
            raise AssertionError(f"Forbidden column remained: {forbidden}")
    for required in ("Online Price", "Price Status", "Image Status"):
        if required not in headers:
            raise AssertionError(f"Required column missing: {required}")
    if master.max_row - 1 != expected_rows or category.max_row - 1 != expected_rows:
        raise AssertionError("Updated catalog row count does not match Category View")
    if latest.max_row - 1 != expected_rows:
        raise AssertionError("Latest Products row count does not match the updated catalog")
    if removed.max_row - 1 != expected_removed:
        raise AssertionError("Removed product count is incorrect")
    if not master.auto_filter.ref or not category.auto_filter.ref or not latest.auto_filter.ref or not removed.auto_filter.ref:
        raise AssertionError("Filters must be enabled on all data sheets")
    if master.freeze_panes != "A2" or category.freeze_panes != "A2" or latest.freeze_panes != "A2" or removed.freeze_panes != "A2":
        raise AssertionError("Data sheet headers must be frozen")


def main() -> None:
    master_headers, masters = read_records(MASTER_PATH, MASTER_SHEET)
    online_headers, online = read_records(ONLINE_PATH, ONLINE_SHEET)
    matched, methods, used_online = match_catalogs(master_headers, masters, online_headers, online)

    online_name_header = find_header(online_headers, {"product name", "name"})
    online_price_header = find_header(
        online_headers, {"online price", "online price aed", "price", "price aed"}
    )
    if not online_name_header or not online_price_header:
        raise ValueError("Online price list must contain Product Name and Online Price columns")

    with IMAGE_URLS_PATH.open(encoding="utf-8") as handle:
        image_urls = json.load(handle)

    output_headers: list[str] = []
    for header in master_headers:
        if header.lower() in REMOVED_MASTER_COLUMNS:
            continue
        output_headers.append(header)
        if header == "Price AED":
            output_headers.extend(["Online Price", "Price Status", "Image Status"])

    updated: list[dict[str, Any]] = []
    removed: list[dict[str, Any]] = []
    for mi, master in enumerate(masters):
        if mi not in matched:
            removed.append(master)
            continue
        online_record = online[matched[mi]]
        row = {header: master.get(header) for header in output_headers}
        row["Online Price"] = online_record.get(online_price_header)
        row["Price Status"] = price_status(master.get("Price AED"), row["Online Price"])
        row["Image Status"] = "Has Image" if has_image(master.get("Slug"), image_urls) else "Missing Image"
        updated.append(row)

    # The Master Catalog remains the structural base, but products appearing only in
    # the Online Price List are included as client-completion rows. Only the two
    # available source fields are populated; all other catalog fields stay blank.
    online_only: list[dict[str, Any]] = []
    for oi, online_record in enumerate(online):
        if oi in used_online:
            continue
        row = {header: None for header in output_headers}
        row["Product Name"] = catalog_product_name(online_record.get(online_name_header))
        row["Online Price"] = online_record.get(online_price_header)
        row["Price Status"] = price_status(None, row["Online Price"])
        row["Image Status"] = "Missing Image"
        updated.append(row)
        online_only.append(row)

    category_rows = sorted(
        (dict(row) for row in updated),
        key=lambda row: (
            text(row.get("Category")).casefold(),
            text(row.get("Subcategory")).casefold(),
            text(row.get("Product Name")).casefold(),
        ),
    )

    summary = {
        "original": len(masters),
        "online": len(online),
        "new": len(updated),
        "removed": len(removed),
        "with_images": sum(row["Image Status"] == "Has Image" for row in updated),
        "missing_images": sum(row["Image Status"] == "Missing Image" for row in updated),
        "changed_prices": sum(row["Price Status"] == "Changed" for row in updated),
        "missing_online_prices": sum(
            row["Price Status"] == "Missing Online Price" for row in updated
        ),
    }

    wb = Workbook()
    add_readme(wb, summary)
    add_data_sheet(wb, "Master Catalog (Updated)", output_headers, updated)
    add_data_sheet(
        wb, "Category View", output_headers, category_rows, category_view=True
    )
    add_latest_products_sheet(wb, category_rows)
    add_removed_sheet(wb, removed)
    wb.calculation.fullCalcOnLoad = True
    wb.calculation.forceFullCalc = True
    wb.save(OUTPUT_PATH)

    validate_output(OUTPUT_PATH, len(updated), len(removed))

    print(f"Created: {OUTPUT_PATH}")
    print(f"Summary: {json.dumps(summary, sort_keys=True)}")
    print(f"Match methods: {dict(sorted(Counter(methods.values()).items()))}")
    print("Removed products:")
    for item in removed:
        print(f"  - {item.get('Code/SKU')}: {item.get('Product Name')}")
    print("Online-only products added for client completion:")
    for item in online_only:
        price = item.get("Online Price")
        print(f"  - {item.get('Product Name')} | Online Price: {price if price is not None else '(blank in source)'}")


if __name__ == "__main__":
    main()

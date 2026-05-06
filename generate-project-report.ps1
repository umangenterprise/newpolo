$outputPath = Join-Path $PSScriptRoot "Ecomer-Website-Report.pdf"

$pages = @(
  @(
    "Ecomer Website Project Report",
    "Project: Umang Full-Stack E-Commerce Website",
    "Generated on: 16 April 2026",
    "",
    "1. Project Overview",
    "This project is a full-stack e-commerce website built for Umang Bags.",
    "It has a React frontend, an Express backend, and MongoDB database support.",
    "",
    "2. Frontend Technologies Used",
    "- React 19 for UI development",
    "- Vite 8 for fast development and production builds",
    "- React Router DOM for routing and protected pages",
    "- Axios for API requests",
    "- Framer Motion for animations",
    "- React Hot Toast for notifications",
    "- React Icons for interface icons",
    "- Context API for auth, cart, and product state",
    "",
    "3. Frontend Pages Available",
    "- Home Page",
    "- Products Page",
    "- Product Details Page",
    "- Cart Page",
    "- Checkout Page",
    "- Auth Page",
    "- Profile Page",
    "- Admin Dashboard",
    "- Admin Products Page",
    "- Admin Orders Page",
    "- Admin Users Page"
  ),
  @(
    "4. Main Frontend Features",
    "- Product search, category filter, and price filter",
    "- Pagination on product listing",
    "- Protected user routes and admin-only routes",
    "- Add to cart, update quantity, and remove item",
    "- Checkout form with address, phone, and email validation",
    "- Toast messages for success and error feedback",
    "- Animated sections and cards using Framer Motion",
    "",
    "5. Backend Technologies Used",
    "- Node.js runtime",
    "- Express.js REST API",
    "- MongoDB with Mongoose models",
    "- JWT token based authentication",
    "- bcryptjs for password hashing",
    "- Multer for product image and payment proof uploads",
    "- Nodemailer for emails",
    "- Razorpay SDK for online payment handling",
    "- dotenv, cors, and express-async-errors",
    "",
    "6. Backend Modules",
    "- Auth routes and controller",
    "- Product routes and controller",
    "- Cart routes and controller",
    "- Order routes and controller",
    "- Admin routes and controller",
    "- Auth middleware, DB-ready middleware, and error middleware",
    "",
    "7. Database Models",
    "- User",
    "- Product",
    "- Cart",
    "- Order"
  ),
  @(
    "8. Payments and Order Logic",
    "- Cash on Delivery support",
    "- Razorpay payment support with verification",
    "- UPI QR order flow with UTR entry and screenshot upload",
    "- GST calculation and total amount generation",
    "- Stock reduce and restore logic",
    "- Delivery estimate generation",
    "- Order cancel and status update flow",
    "",
    "9. Admin Features",
    "- Dashboard stats for users, orders, products, and revenue",
    "- Add, edit, and delete products",
    "- Upload up to 4 product images",
    "- View and manage all orders",
    "- Update order status and payment status",
    "- Block or unblock users",
    "- Delete non-admin users",
    "",
    "10. Deployment Setup",
    "- Frontend prepared for Netlify deployment",
    "- Backend prepared for Render deployment",
    "- netlify.toml and render.yaml configuration present",
    "- Health endpoint available at /api/health",
    "",
    "11. Extra Integrations",
    "- Static uploads folder for images",
    "- Email helper utilities",
    "- SMS helper utilities",
    "- Seed scripts for products and admin setup",
    "",
    "End of report."
  )
)

function Escape-PdfText {
  param([string]$Text)

  return $Text.Replace("\", "\\").Replace("(", "\(").Replace(")", "\)")
}

$objects = New-Object System.Collections.Generic.List[string]

function Add-PdfObject {
  param([string]$Body)

  $script:objects.Add($Body) | Out-Null
  return $script:objects.Count
}

$fontObject = Add-PdfObject "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"

$pageObjectIds = @()
$contentObjectIds = @()

foreach ($pageLines in $pages) {
  $streamLines = New-Object System.Collections.Generic.List[string]
  $streamLines.Add("BT") | Out-Null
  $streamLines.Add("/F1 20 Tf") | Out-Null
  $streamLines.Add("50 790 Td") | Out-Null

  $isFirstLine = $true
  foreach ($line in $pageLines) {
    if ($isFirstLine) {
      $streamLines.Add("(" + (Escape-PdfText $line) + ") Tj") | Out-Null
      $streamLines.Add("/F1 11 Tf") | Out-Null
      $isFirstLine = $false
      continue
    }

    if ($line -eq "") {
      $streamLines.Add("0 -12 Td") | Out-Null
    }
    else {
      $streamLines.Add("0 -16 Td") | Out-Null
      $streamLines.Add("(" + (Escape-PdfText $line) + ") Tj") | Out-Null
    }
  }

  $streamLines.Add("ET") | Out-Null
  $stream = [string]::Join("`n", $streamLines)
  $contentBody = "<< /Length " + $stream.Length + " >>`nstream`n" + $stream + "`nendstream"
  $contentId = Add-PdfObject $contentBody
  $pageBody = "<< /Type /Page /Parent PAGES_REF /MediaBox [0 0 595 842] /Resources << /Font << /F1 " + $fontObject + " 0 R >> >> /Contents " + $contentId + " 0 R >>"
  $pageId = Add-PdfObject $pageBody
  $contentObjectIds += $contentId
  $pageObjectIds += $pageId
}

$kids = ($pageObjectIds | ForEach-Object { "$_ 0 R" }) -join " "
$pagesBody = "<< /Type /Pages /Count " + $pageObjectIds.Count + " /Kids [ " + $kids + " ] >>"
$pagesObject = Add-PdfObject $pagesBody

for ($i = 0; $i -lt $pageObjectIds.Count; $i++) {
  $index = $pageObjectIds[$i] - 1
  $objects[$index] = $objects[$index].Replace("PAGES_REF", "$pagesObject 0 R")
}

$catalogObject = Add-PdfObject "<< /Type /Catalog /Pages " + $pagesObject + " 0 R >>"

$pdf = New-Object System.Text.StringBuilder
[void]$pdf.Append("%PDF-1.4`n")

$offsets = New-Object System.Collections.Generic.List[int]
$offsets.Add(0) | Out-Null

for ($i = 0; $i -lt $objects.Count; $i++) {
  $offsets.Add($pdf.Length) | Out-Null
  [void]$pdf.Append(($i + 1).ToString() + " 0 obj`n")
  [void]$pdf.Append($objects[$i] + "`n")
  [void]$pdf.Append("endobj`n")
}

$xrefStart = $pdf.Length
[void]$pdf.Append("xref`n")
[void]$pdf.Append("0 " + ($objects.Count + 1) + "`n")
[void]$pdf.Append("0000000000 65535 f `n")

for ($i = 1; $i -le $objects.Count; $i++) {
  [void]$pdf.Append(($offsets[$i].ToString("0000000000")) + " 00000 n `n")
}

[void]$pdf.Append("trailer`n")
[void]$pdf.Append("<< /Size " + ($objects.Count + 1) + " /Root " + $catalogObject + " 0 R >>`n")
[void]$pdf.Append("startxref`n")
[void]$pdf.Append($xrefStart + "`n")
[void]$pdf.Append("%%EOF")

[System.IO.File]::WriteAllText($outputPath, $pdf.ToString(), [System.Text.Encoding]::ASCII)
Write-Output $outputPath

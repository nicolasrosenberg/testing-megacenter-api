const { Resend } = require("resend");
const fs = require("fs");
const path = require("path");
const { logInfo, logError } = require("../../middleware/logger");
const locationsData = require("../../utils/locations");
const { getLocationSlug } = require("../../config/locations");

const resend = new Resend(process.env.RESEND_API_KEY);

function generateEmailHTML(data, location) {
	const hasDiscount = data.stdRate && data.webRate && data.stdRate !== data.webRate;

	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Reservation Confirmed</title>
<style>
body{margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f8f9fa}
.container{max-width:600px;margin:0 auto;background:#fff}
.header{text-align:center;padding:48px 40px 40px}
.logo{max-width:220px;height:auto}
.content{padding:0 40px 48px}
h1{font-size:30px;font-weight:500;color:#1a1a1a;margin:0 0 12px 0;line-height:1.3;text-align:center;letter-spacing:-0.5px}
.subtitle{font-size:17px;color:#6b7280;margin:0 0 48px 0;line-height:1.6;text-align:center}
.section-title{font-size:20px;font-weight:600;color:#1a1a1a;margin:48px 0 20px 0}
.info-table{width:100%;font-size:16px;color:#212529;background:#fff;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:24px;overflow:hidden}
.info-table tr{border-bottom:1px solid #f3f4f6}
.info-table tr:last-child{border-bottom:none}
.info-table td{padding:8px 20px;vertical-align:top}
.label{color:#6b7280;text-align:left;font-weight:500;font-size:15px}
.value{color:#1a1a1a;text-align:right;font-weight:500;font-size:15px}
.highlight{font-weight:700;color:#0042d4;font-size:18px}
.line-through{font-weight:400;color:#9ca3af;text-decoration:line-through;margin-right:8px}
.info-table a{color:#0042d4;text-decoration:none;font-weight:500}
.footer{width:100%;font-size:16px;padding:48px 40px;color:#fff;background:linear-gradient(135deg,#0042d4 0%,#0056f5 100%)}
.footer table{width:100%}
.footer-logo{display:block;border:0;max-width:160px;height:auto}
.header-table{width:100%;margin-bottom:32px}
.header-table td{vertical-align:middle}
.social-icons{text-align:right}
.social-icon{display:inline-block;margin-left:12px}
.social-icon img{width:24px;height:24px;border:0}
.locations-title{font-size:18px;font-weight:600;color:#fff;margin:0 0 16px 0}
.locations-table{width:100%;border-spacing:16px 0;margin-bottom:24px}
.locations-table td{width:33.33%;vertical-align:top;background:rgba(255,255,255,0.1);padding:16px;border-radius:8px}
.location-name{font-size:15px;font-weight:600;color:#fff;margin:0 0 8px 0}
.location-detail{font-size:13px;font-weight:400;color:#d4ddf5;margin:0;padding:0;line-height:1.6}
.footer-legal{padding-top:32px;font-size:13px;color:#b8c5f0;text-align:center;border-top:1px solid rgba(255,255,255,0.2);margin-top:32px}
.footer-legal a{color:#fff;text-decoration:none;font-weight:500}
.dot{margin:0 8px;color:#b8c5f0}
</style>
</head>
<body>
<div class="container">
<div class="header"><img src="cid:logo-header" alt="Megacenter" class="logo"></div>
<div class="content">
<h1>Your Megacenter storage reservation is confirmed.</h1>
<p class="subtitle">Our team will assist you in completing your move-in in person or by phone.</p>
<h2 class="section-title">Your Reservation</h2>
<table class="info-table">
<tr><td class="label">Tenant</td><td class="value">${data.firstName} ${data.lastName}</td></tr>
<tr><td class="label">Reservation</td><td class="value">#${data.reservationNumber}</td></tr>
<tr><td class="label">Unit</td><td class="value">#${data.unitName}</td></tr>
<tr><td class="label">Type</td><td class="value">${data.typeName}</td></tr>
<tr><td class="label">Dimensions</td><td class="value">${data.width} × ${data.length}</td></tr>
<tr><td class="label">Area</td><td class="value">${data.area} sq ft</td></tr>
<tr><td class="label">Monthly Rate</td><td class="value">${hasDiscount ? `<span class="line-through">$${data.stdRate}</span> ` : ''}<span class="highlight">$${data.webRate}</span></td></tr>
</table>
<h2 class="section-title">Our Facility</h2>
<table class="info-table">
<tr><td class="label">Location</td><td class="value">${location.title}</td></tr>
<tr><td class="label">Address</td><td class="value"><a href="https://maps.google.com/?q=${encodeURIComponent(location.fullAddress)}">${location.fullAddress}</a></td></tr>
<tr><td class="label">Phone</td><td class="value"><a href="tel:${location.phone}">${location.phone}</a></td></tr>
<tr><td class="label">Email</td><td class="value"><a href="mailto:${location.email}">${location.email}</a></td></tr>
<tr><td class="label">Access Hours</td><td class="value">${location.accessHours}</td></tr>
<tr><td class="label">Office Hours</td><td class="value">${location.officeHours}</td></tr>
</table>
</div>
<div class="footer">
<table class="header-table">
<tr>
<td><img src="cid:logo-footer" alt="Megacenter" class="footer-logo"></td>
<td class="social-icons">
<a href="https://www.instagram.com/megacenterus/" class="social-icon"><img src="cid:icon-instagram" alt="Instagram"></a>
<a href="https://www.facebook.com/megacenterus/" class="social-icon"><img src="cid:icon-facebook" alt="Facebook"></a>
<a href="https://www.linkedin.com/company/megacenter-us/" class="social-icon"><img src="cid:icon-linkedin" alt="LinkedIn"></a>
<a href="https://x.com/megacenterus" class="social-icon"><img src="cid:icon-x" alt="X"></a>
</td>
</tr>
</table>
<div class="locations-title">Our Locations</div>
<table class="locations-table">
<tr>
<td><p class="location-name">Megacenter Brickell</p><p class="location-detail">420 SW 7th Street<br>Miami, FL 33130<br>+1 (786) 635-1301</p></td>
<td><p class="location-name">Megacenter Memorial</p><p class="location-detail">1530 W Sam Houston Pkwy N<br>Houston, TX 77043<br>+1 (844) 287-0777</p></td>
<td><p class="location-name">Megacenter Willowbrook</p><p class="location-detail">7075 FM 1960 Rd W<br>Houston, TX 77069<br>+1 (832) 930-9100</p></td>
</tr>
</table>
<div class="footer-legal">© ${new Date().getFullYear()} Megacenter. All rights reserved. <span class="dot">•</span> <a href="https://megacenter.com/privacy">Privacy</a> <span class="dot">•</span> <a href="https://megacenter.com/terms">Terms</a></div>
</div>
</div>
</body>
</html>
	`;
}

async function sendReservationConfirmation(data, locationCode) {
	try {
		// Get location data
		const locationSlug = getLocationSlug(locationCode);
		const location = locationSlug ? locationsData[locationSlug] : null;

		if (!location) {
			logError("MailingService", "Invalid location code", {
				locationCode,
			});
			throw new Error(`Invalid location code: ${locationCode}`);
		}

		logInfo("MailingService", "Sending reservation confirmation email", {
			email: data.email,
			reservationId: data.reservationId,
			location: location.name,
		});

		const htmlContent = generateEmailHTML(data, location);

		// Read images and convert to base64
		const publicPath = path.join(__dirname, "../../..", "public", "images");

		const logoHeader = fs.readFileSync(path.join(publicPath, "logos", "megacenter-logo.png")).toString("base64");
		const logoFooter = fs.readFileSync(path.join(publicPath, "logos", "megacenter-logo-white.png")).toString("base64");
		const iconInstagram = fs.readFileSync(path.join(publicPath, "social", "instagram.png")).toString("base64");
		const iconFacebook = fs.readFileSync(path.join(publicPath, "social", "facebook.png")).toString("base64");
		const iconLinkedin = fs.readFileSync(path.join(publicPath, "social", "linkedin.png")).toString("base64");
		const iconX = fs.readFileSync(path.join(publicPath, "social", "x.png")).toString("base64");

		const result = await resend.emails.send({
			from: "onboarding@resend.dev",
			to: data.email,
			subject: "Your Megacenter storage reservation is confirmed",
			html: htmlContent,
			attachments: [
				{
					content: logoHeader,
					filename: "megacenter-logo.png",
					contentId: "logo-header",
				},
				{
					content: logoFooter,
					filename: "megacenter-logo-white.png",
					contentId: "logo-footer",
				},
				{
					content: iconInstagram,
					filename: "instagram.png",
					contentId: "icon-instagram",
				},
				{
					content: iconFacebook,
					filename: "facebook.png",
					contentId: "icon-facebook",
				},
				{
					content: iconLinkedin,
					filename: "linkedin.png",
					contentId: "icon-linkedin",
				},
				{
					content: iconX,
					filename: "x.png",
					contentId: "icon-x",
				},
			],
		});

		console.log(result);

		logInfo("MailingService", "Email sent successfully", {
			emailId: result.data?.id,
		});

		return result;
	} catch (error) {
		logError("MailingService", "Failed to send email", {
			error: error.message,
			email: data.email,
		});
		throw error;
	}
}

module.exports = {
	sendReservationConfirmation,
};

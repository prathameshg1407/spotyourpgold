// components/pdf/InvoicePDF.tsx
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// Register fonts (optional - for better typography)
Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf",
      fontWeight: "normal",
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf",
      fontWeight: "bold",
    },
  ],
});

// Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Roboto",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 3,
    borderBottomColor: "#E67E22",
  },
  logo: {
    fontSize: 24,
    fontWeight: "bold",
  },
  logoSpot: {
    color: "#E67E22",
  },
  logoYour: {
    color: "#333333",
  },
  logoPG: {
    color: "#E67E22",
  },
  invoiceTitle: {
    textAlign: "right",
  },
  invoiceTitleText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 5,
  },
  invoiceSubtitle: {
    fontSize: 10,
    color: "#666666",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333333",
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  column: {
    width: "48%",
  },
  box: {
    padding: 15,
    backgroundColor: "#F9F9F9",
    borderRadius: 5,
  },
  boxTitle: {
    fontSize: 9,
    color: "#999999",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  boxText: {
    fontSize: 10,
    marginBottom: 3,
    color: "#333333",
  },
  boxTextBold: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 3,
    color: "#333333",
  },
  highlight: {
    color: "#E67E22",
    fontWeight: "bold",
  },
  propertyDetails: {
    backgroundColor: "#FFF9F5",
    padding: 15,
    borderRadius: 5,
    marginBottom: 20,
  },
  propertyTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333333",
  },
  propertyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  propertyItem: {
    width: "50%",
    flexDirection: "row",
    marginBottom: 8,
  },
  propertyLabel: {
    fontSize: 9,
    color: "#666666",
    width: 80,
  },
  propertyValue: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#333333",
    flex: 1,
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#E67E22",
    padding: 10,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  tableHeaderCell: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableHeaderCellDescription: {
    flex: 3,
  },
  tableHeaderCellDuration: {
    flex: 1,
    textAlign: "center",
  },
  tableHeaderCellAmount: {
    flex: 1,
    textAlign: "right",
  },
  tableRow: {
    flexDirection: "row",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    backgroundColor: "#FFFFFF",
  },
  tableCell: {
    fontSize: 10,
    color: "#333333",
  },
  tableCellDescription: {
    flex: 3,
  },
  tableCellDuration: {
    flex: 1,
    textAlign: "center",
  },
  tableCellAmount: {
    flex: 1,
    textAlign: "right",
  },
  tableCellTitle: {
    fontWeight: "bold",
    marginBottom: 2,
  },
  tableCellSubtitle: {
    fontSize: 9,
    color: "#666666",
  },
  totalsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 20,
  },
  totalsBox: {
    width: 250,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  totalsRowDiscount: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    color: "#27AE60",
  },
  totalsRowTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: "#333333",
    marginTop: 5,
  },
  totalsLabel: {
    fontSize: 10,
    color: "#666666",
  },
  totalsValue: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#333333",
  },
  totalAmount: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#E67E22",
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333333",
  },
  discountLabel: {
    fontSize: 10,
    color: "#27AE60",
  },
  discountValue: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#27AE60",
  },
  paymentStatus: {
    textAlign: "center",
    padding: 12,
    backgroundColor: "#D4EDDA",
    borderWidth: 1,
    borderColor: "#C3E6CB",
    borderRadius: 5,
    marginBottom: 20,
  },
  paymentStatusTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#155724",
    marginBottom: 3,
  },
  paymentStatusDate: {
    fontSize: 9,
    color: "#155724",
  },
  terms: {
    backgroundColor: "#F5F5F5",
    padding: 15,
    borderRadius: 5,
    marginBottom: 20,
  },
  termsTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333333",
  },
  termsList: {
    paddingLeft: 10,
  },
  termsItem: {
    fontSize: 9,
    color: "#666666",
    marginBottom: 5,
    flexDirection: "row",
  },
  termsBullet: {
    width: 15,
    color: "#999999",
  },
  termsText: {
    flex: 1,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    paddingTop: 20,
    textAlign: "center",
  },
  footerText: {
    fontSize: 9,
    color: "#666666",
    marginBottom: 3,
  },
  footerBrand: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 5,
  },
  watermark: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 60,
    color: "#F5F5F5",
    transform: "rotate(-45deg)",
    fontWeight: "bold",
  },
});

// Helper function to convert number to words (Indian format)
const numberToWords = (num: number): string => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  if (num === 0) return 'Zero';

  const convertLessThanThousand = (n: number): string => {
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) {
      return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    }
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanThousand(n % 100) : '');
  };

  if (num < 1000) {
    return convertLessThanThousand(num);
  }
  if (num < 100000) {
    return convertLessThanThousand(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 !== 0 ? ' ' + convertLessThanThousand(num % 1000) : '');
  }
  if (num < 10000000) {
    return convertLessThanThousand(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 !== 0 ? ' ' + numberToWords(num % 100000) : '');
  }
  return convertLessThanThousand(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 !== 0 ? ' ' + numberToWords(num % 10000000) : '');
};

// Format currency
const formatCurrency = (amount: number): string => {
  return `₹${amount.toLocaleString('en-IN')}`;
};

// Format date
const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
};

// Types
interface InvoiceAddress {
  street: string;
  city: string;
  state: string;
  pincode: string;
}

interface InvoiceOwner {
  fullName?: string;
  email?: string;
  phone?: string;
}

interface InvoiceLocation {
  area: string;
  city: string;
  state?: string;
  pincode?: string;
}

interface InvoiceListing {
  pgName: string;
  location: InvoiceLocation;
  ownerId?: InvoiceOwner;
}

interface InvoiceBooking {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  address: InvoiceAddress;
  roomType: string;
  moveInDate: string;
  duration: string;
  amount: number;
  originalAmount: number;
  discountAmount: number;
  securityDeposit: number;
  couponCode?: string | null;
  paymentMethod: string;
  adminVerifiedAt?: string | null;
  createdAt: string;
  listingId: InvoiceListing;
}

interface InvoicePDFProps {
  booking: InvoiceBooking;
}

// Main PDF Component
const InvoicePDF: React.FC<InvoicePDFProps> = ({ booking }) => {
  const invoiceDate = formatDate(new Date().toISOString());
  const moveInDate = formatDate(booking.moveInDate);
  const totalAmount = booking.amount + booking.securityDeposit;
  const receiptNumber = booking._id.slice(-8).toUpperCase();
  const bookingId = booking._id.slice(-12).toUpperCase();

  const listing = booking.listingId;
  const owner = listing?.ownerId;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Watermark */}
        <Text style={styles.watermark}>PAID</Text>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>
              <Text style={styles.logoSpot}>Spot</Text>
              <Text style={styles.logoYour}>Your</Text>
              <Text style={styles.logoPG}>PG</Text>
            </Text>
          </View>
          <View style={styles.invoiceTitle}>
            <Text style={styles.invoiceTitleText}>INVOICE</Text>
            <Text style={styles.invoiceSubtitle}>Receipt #{receiptNumber}</Text>
            <Text style={styles.invoiceSubtitle}>Date: {invoiceDate}</Text>
          </View>
        </View>

        {/* Billing Info */}
        <View style={styles.row}>
          <View style={styles.column}>
            <View style={styles.box}>
              <Text style={styles.boxTitle}>Billed To</Text>
              <Text style={styles.boxTextBold}>{booking.fullName}</Text>
              <Text style={styles.boxText}>{booking.email}</Text>
              <Text style={styles.boxText}>{booking.phoneNumber}</Text>
              <Text style={styles.boxText}>{booking.address.street}</Text>
              <Text style={styles.boxText}>
                {booking.address.city}, {booking.address.state} - {booking.address.pincode}
              </Text>
            </View>
          </View>
          <View style={styles.column}>
            <View style={styles.box}>
              <Text style={styles.boxTitle}>Property Owner</Text>
              <Text style={styles.boxTextBold}>{owner?.fullName || 'PG Owner'}</Text>
              {owner?.email && <Text style={styles.boxText}>{owner.email}</Text>}
              {owner?.phone && <Text style={styles.boxText}>{owner.phone}</Text>}
              <Text style={[styles.boxText, styles.highlight]}>Booking ID: {bookingId}</Text>
            </View>
          </View>
        </View>

        {/* Property Details */}
        <View style={styles.propertyDetails}>
          <Text style={styles.propertyTitle}>🏠 Property Details</Text>
          <View style={styles.propertyGrid}>
            <View style={styles.propertyItem}>
              <Text style={styles.propertyLabel}>PG Name:</Text>
              <Text style={styles.propertyValue}>{listing?.pgName || 'N/A'}</Text>
            </View>
            <View style={styles.propertyItem}>
              <Text style={styles.propertyLabel}>Room Type:</Text>
              <Text style={styles.propertyValue}>{booking.roomType}</Text>
            </View>
            <View style={styles.propertyItem}>
              <Text style={styles.propertyLabel}>Location:</Text>
              <Text style={styles.propertyValue}>
                {listing?.location?.area}, {listing?.location?.city}
              </Text>
            </View>
            <View style={styles.propertyItem}>
              <Text style={styles.propertyLabel}>Move-in Date:</Text>
              <Text style={styles.propertyValue}>{moveInDate}</Text>
            </View>
            <View style={styles.propertyItem}>
              <Text style={styles.propertyLabel}>Duration:</Text>
              <Text style={styles.propertyValue}>{booking.duration} Months</Text>
            </View>
            <View style={styles.propertyItem}>
              <Text style={styles.propertyLabel}>Payment:</Text>
              <Text style={styles.propertyValue}>{booking.paymentMethod.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.tableHeaderCellDescription]}>
              Description
            </Text>
            <Text style={[styles.tableHeaderCell, styles.tableHeaderCellDuration]}>
              Duration
            </Text>
            <Text style={[styles.tableHeaderCell, styles.tableHeaderCellAmount]}>
              Amount (₹)
            </Text>
          </View>

          <View style={styles.tableRow}>
            <View style={styles.tableCellDescription}>
              <Text style={[styles.tableCell, styles.tableCellTitle]}>
                Monthly Rent - {booking.roomType}
              </Text>
              <Text style={styles.tableCellSubtitle}>
                First month rent for {listing?.pgName}
              </Text>
            </View>
            <Text style={[styles.tableCell, styles.tableCellDuration]}>1 Month</Text>
            <Text style={[styles.tableCell, styles.tableCellAmount]}>
              {formatCurrency(booking.originalAmount)}
            </Text>
          </View>

          <View style={styles.tableRow}>
            <View style={styles.tableCellDescription}>
              <Text style={[styles.tableCell, styles.tableCellTitle]}>Security Deposit</Text>
              <Text style={styles.tableCellSubtitle}>Refundable security deposit</Text>
            </View>
            <Text style={[styles.tableCell, styles.tableCellDuration]}>-</Text>
            <Text style={[styles.tableCell, styles.tableCellAmount]}>
              {formatCurrency(booking.securityDeposit)}
            </Text>
          </View>
        </View>

        {/* Totals */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text style={styles.totalsValue}>
                {formatCurrency(booking.originalAmount + booking.securityDeposit)}
              </Text>
            </View>

            {booking.discountAmount > 0 && (
              <View style={styles.totalsRowDiscount}>
                <Text style={styles.discountLabel}>
                  Discount {booking.couponCode ? `(${booking.couponCode})` : ''}
                </Text>
                <Text style={styles.discountValue}>
                  -{formatCurrency(booking.discountAmount)}
                </Text>
              </View>
            )}

            <View style={styles.totalsRowTotal}>
              <Text style={styles.totalLabel}>Total Paid</Text>
              <Text style={styles.totalAmount}>{formatCurrency(totalAmount)}</Text>
            </View>
          </View>
        </View>

        {/* Amount in Words */}
        <View style={[styles.section, { marginBottom: 10 }]}>
          <Text style={{ fontSize: 9, color: '#666666', fontStyle: 'italic' }}>
            Amount in words: {numberToWords(totalAmount)} Rupees Only
          </Text>
        </View>

        {/* Payment Status */}
        <View style={styles.paymentStatus}>
          <Text style={styles.paymentStatusTitle}>✅ PAYMENT RECEIVED</Text>
          <Text style={styles.paymentStatusDate}>
            Cash payment verified on{' '}
            {booking.adminVerifiedAt ? formatDate(booking.adminVerifiedAt) : invoiceDate}
          </Text>
        </View>

        {/* Terms */}
        <View style={styles.terms}>
          <Text style={styles.termsTitle}>Terms & Conditions</Text>
          <View style={styles.termsList}>
            <View style={styles.termsItem}>
              <Text style={styles.termsBullet}>•</Text>
              <Text style={styles.termsText}>
                Security deposit is refundable at the time of checkout, subject to property condition.
              </Text>
            </View>
            <View style={styles.termsItem}>
              <Text style={styles.termsBullet}>•</Text>
              <Text style={styles.termsText}>
                Monthly rent is due on the same date as move-in date each month.
              </Text>
            </View>
            <View style={styles.termsItem}>
              <Text style={styles.termsBullet}>•</Text>
              <Text style={styles.termsText}>
                This is a computer-generated invoice and does not require a signature.
              </Text>
            </View>
            <View style={styles.termsItem}>
              <Text style={styles.termsBullet}>•</Text>
              <Text style={styles.termsText}>
                For any queries, contact SpotYourPG support.
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerBrand}>
            SpotYourPG - Find Your Perfect Paying Guest Accommodation
          </Text>
          <Text style={styles.footerText}>
            Email: support@spotyourpg.com | Website: www.spotyourpg.com
          </Text>
          <Text style={styles.footerText}>Thank you for choosing SpotYourPG!</Text>
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePDF;
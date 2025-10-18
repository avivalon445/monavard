```markdown
# CustomBid Platform Documentation

## Overview

CustomBid is an innovative platform that enables customers to purchase custom-made products that don't exist in the regular market. The platform connects customers with suppliers through an anonymous bidding system, utilizing AI for automatic request categorization and matching.

## Platform Architecture

### Technology Stack

**Frontend:**
- React.js - Modern dynamic user interface (eith typescript files)

**Backend:**
- Node.js - Runtime environment
- Express.js - Server framework
- JWT - Authentication and authorization
- bcrypt - Password encryption
- multer - File uploads
- nodemailer - Email notifications

**Database:**
- MySQL - Relational database

**External Services:**
- OpenAI API - Automatic request categorization
- Payment Gateway (Stripe/PayPal) - Payment processing
- Cloud Storage (AWS S3/Google Cloud) - File storage

---

## Three Main Interfaces

### 1. Public Interface (Unauthenticated Users)

The public interface serves visitors who haven't logged in yet and provides general information about the platform.

#### Available Pages:

**Home Page (`/`)**
- Service explanation and value proposition
- Basic platform statistics
- Registration links for customers and suppliers
- Featured success stories

**About Page (`/about`)**
- Company and service description
- Platform advantages and unique features
- How the platform works
- Team information

**Contact Page (`/contact`)**
- Contact form for inquiries
- Contact details (email, phone, address)
- FAQ section
- Support information

**Login Page (`/login`)**
- Login form (email + password)
- "Forgot password" link
- Link to registration page
- Option to login as customer or supplier

**Registration Page (`/register`)**
- User type selection (customer/supplier)
- Appropriate registration form based on selection
- Email verification process
- Terms and conditions acceptance

---

### 2. Customer Interface

The customer interface allows buyers to create product requests, receive bids, and manage orders.

#### Key Features:

**Customer Dashboard (`/dashboard/customer`)**
- Activity overview and statistics
- Recent requests summary
- New bids notifications
- Active orders status
- Quick actions menu

**New Product Request (`/customer/request-new`)**
- Free-text product description form
- File/image upload capability
- Budget range setting
- Required delivery date selection
- AI-powered category suggestions
- Request preview before submission

**My Requests (`/customer/requests`)**
- List of all product requests
- Filter by status (pending/active/closed)
- Detailed view for each request
- Edit pending requests
- View received bids count
- Request history

**Bids Management (`/customer/bids`)**
- All bids for each request
- Anonymous supplier information
- Bid comparison tools
- Price, delivery time, and description view
- Accept/reject bid actions
- Communication with suppliers (anonymous)

**My Orders (`/customer/orders`)**
- Active orders tracking
- Order status updates
- Progress photos from suppliers
- Order history
- Supplier rating system
- Invoice and receipt downloads

**Profile Settings (`/customer/profile`)**
- Personal information editing
- Contact details management
- Password change
- Notification preferences
- Account deactivation option

#### Customer Flow:

1. **Registration** → Email verification → Login
2. **Create Request** → Describe product → Upload images → Set budget/deadline
3. **AI Processing** → Request categorized → Sent to relevant suppliers
4. **Receive Bids** → Compare offers → Communicate with suppliers
5. **Accept Bid** → Create order → Pay commission
6. **Track Order** → Receive updates → Get product → Rate supplier

---

### 3. Supplier Interface

The supplier interface enables businesses to view requests, submit bids, and manage orders.

#### Key Features:

**Supplier Dashboard (`/dashboard/supplier`)**
- Activity overview and statistics
- New available requests
- Active orders status
- Pending bids tracking
- Revenue summary

**Available Requests (`/supplier/requests`)**
- List of active requests in supplier's categories
- Filter by:
  - Budget range
  - Delivery date
  - Category
  - Date posted
- Detailed request view (anonymous customer)
- Request images and specifications
- Customer requirements

**My Bids (`/supplier/bids`)**
- All submitted bids
- Bid status (pending/accepted/rejected)
- Edit pending bids
- Bid history and statistics
- Win rate tracking

**My Orders (`/supplier/orders`)**
- Active orders management
- Status updates:
  - Pending
  - In Progress
  - Completed
  - Cancelled
- Progress photo uploads
- Customer communication (anonymous)
- Delivery confirmation
- Payment tracking

**Profile Settings (`/supplier/profile`)**
- Company information editing
- Business license upload
- Category management (add/remove specializations)
- Experience years per category
- Portfolio uploads
- Bank account details for payments

#### Supplier Flow:

1. **Registration** → Company details → Upload documents → Select categories → Admin approval
2. **View Requests** → Filter relevant requests → View details
3. **Submit Bid** → Calculate price → Set delivery time → Describe offer
4. **Win Order** → Receive notification → Confirm order
5. **Fulfill Order** → Update status → Upload progress photos → Deliver product
6. **Receive Payment** → Get customer rating → Build reputation

---

## Key Platform Features

### Anonymous Bidding System
- Suppliers remain anonymous until bid acceptance
- Prevents direct contact outside platform
- Secure communication through platform messaging
- Customer and supplier identities protected during bidding

### AI-Powered Categorization
- OpenAI integration analyzes product requests
- Automatic category assignment
- Smart supplier matching
- Request clarity scoring

### Commission-Based Revenue
- Platform charges commission on completed orders
- Transparent fee structure
- Automatic commission calculation
- Secure payment processing

### Rating & Review System
- Customers rate suppliers after order completion
- Build supplier reputation
- Quality assurance mechanism
- Helps future customers make informed decisions

---

## Security & Privacy

### Data Protection
- bcrypt password encryption
- JWT authentication for all requests
- Role-based access control
- Activity logging for sensitive operations

### Supplier Anonymity
- No identity disclosure to customers before acceptance
- Anonymous communication system
- Prevents information leakage
- Fair competition environment

### Payment Security
- Trusted payment gateway integration
- No credit card data storage
- Encrypted payment information
- PCI compliance

---

## User Roles & Permissions

| Feature | Public | Customer | Supplier | Admin |
|---------|--------|----------|----------|-------|
| View public pages | ✓ | ✓ | ✓ | ✓ |
| Create requests | ✗ | ✓ | ✗ | ✓ |
| Submit bids | ✗ | ✗ | ✓ | ✓ |
| View all users | ✗ | ✗ | ✗ | ✓ |
| Manage categories | ✗ | ✗ | ✗ | ✓ |
| Configure commissions | ✗ | ✗ | ✗ | ✓ |

---

## Future Enhancements

### Phase 2 Features:
- Real-time chat between customers and suppliers
- Advanced analytics dashboard
- Mobile applications (iOS/Android)
- Multi-language support
- Enhanced AI recommendations

### Phase 3 Features:
- Supplier verification badges
- Escrow payment system
- Dispute resolution mechanism
- API for third-party integrations
- Marketplace for standard products

---

## Support & Contact

For technical support or questions about using the platform:
- Email: support@custombid.com
- Phone: [Support Number]
- Documentation: docs.custombid.com
- Status Page: status.custombid.com

---

## Getting Started

### For Customers:
1. Register at `/register`
2. Verify your email
3. Create your first product request
4. Wait for supplier bids
5. Choose the best offer and start your order

### For Suppliers:
1. Register as a supplier at `/register`
2. Upload business documents
3. Select your expertise categories
4. Wait for admin approval
5. Start bidding on relevant requests

---

*Last Updated: 14/10/25*
*Version: 1.0*
```
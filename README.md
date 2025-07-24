# Baby Care - Parental Support App

A comprehensive web-based application designed to help new parents track and manage their baby's care activities, health conditions, and developmental milestones. The app features dual-parent access, Google Calendar integration, and detailed analytics to support effective parenting.

## 🍼 Features

### Core Functionality
- **Activity Tracking**: Log feeding sessions, diaper changes, sleep patterns, mood states, and health conditions
- **Multi-Baby Support**: Manage multiple babies within a family account
- **Dual-Parent Access**: Both parents can access and update baby information with role-based permissions
- **Real-time Synchronization**: All family members see updates in real-time

### Health & Development
- **Health Monitoring**: Track conditions like colic, rashes, fever, and other health issues
- **Medication Management**: Log and track baby medications with dosage and scheduling
- **Milestone Tracking**: Record developmental milestones across physical, cognitive, social, and language categories
- **Growth Tracking**: Monitor weight and length with visual charts

### Smart Features
- **Google Calendar Integration**: Sync baby activities to Google Calendar for better family scheduling
- **Analytics & Insights**: Visual dashboards showing sleep patterns, feeding trends, and activity summaries
- **Smart Notifications**: Reminders for feeding, medication, and health checkups
- **Data Export**: Export activity data for pediatrician visits

### Family Management
- **Family Invitations**: Invite partners, caregivers, and family members
- **Role-based Permissions**: Control who can view, edit, or manage family data
- **Multiple Family Support**: Manage multiple family units (useful for caregivers)

## 🚀 Technology Stack

### Backend
- **Node.js** with Express.js framework
- **MongoDB** with Mongoose ODM
- **JWT** authentication with Google OAuth2 integration
- **Google Calendar API** for calendar synchronization
- **Rate limiting** and security middleware

### Frontend
- **React 18** with modern hooks and context
- **Material-UI (MUI)** for beautiful, responsive design
- **React Router** for navigation
- **Axios** for API communication
- **Chart.js/Recharts** for data visualization

### Security & Performance
- **Helmet.js** for security headers
- **bcrypt** for password hashing
- **Input validation** with express-validator
- **Role-based access control**
- **API rate limiting**

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- Google Cloud Console account (for OAuth and Calendar API)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd baby-care-app
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install

# Return to root
cd ..
```

### 3. Environment Configuration

Create a `.env` file in the `server` directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/babycare
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
NODE_ENV=development

# Google OAuth & Calendar API
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# Frontend URL
CLIENT_URL=http://localhost:3000
```

### 4. Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google Calendar API and Google+ API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/auth/google/callback`
5. Copy the Client ID and Client Secret to your `.env` file

### 5. Database Setup

Make sure MongoDB is running locally or update the `MONGODB_URI` to point to your cloud database.

### 6. Start the Application

```bash
# Start both client and server concurrently
npm run dev

# Or start them separately:
# Terminal 1 - Start server
npm run server

# Terminal 2 - Start client
npm run client
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🔧 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/google/url` - Get Google OAuth URL
- `POST /api/auth/google/callback` - Handle Google OAuth callback
- `GET /api/auth/verify` - Verify JWT token
- `GET /api/auth/profile` - Get user profile

### Baby Management
- `GET /api/baby` - Get user's babies
- `POST /api/baby` - Create new baby
- `GET /api/baby/:id` - Get baby details
- `PUT /api/baby/:id` - Update baby information
- `POST /api/baby/:id/milestones` - Add milestone
- `PUT /api/baby/:id/medical` - Update medical info

### Activity Tracking
- `POST /api/activity` - Create new activity
- `GET /api/activity/baby/:babyId` - Get baby's activities
- `GET /api/activity/baby/:babyId/today` - Get today's activities
- `GET /api/activity/baby/:babyId/summary` - Get activity analytics
- `PUT /api/activity/:id` - Update activity
- `DELETE /api/activity/:id` - Delete activity

### Calendar Integration
- `GET /api/calendar/status` - Check calendar connection status
- `GET /api/calendar/calendars` - Get user's calendars
- `POST /api/calendar/sync-activity` - Sync single activity
- `POST /api/calendar/sync-activities` - Bulk sync activities

### Family Management
- `GET /api/user/families` - Get user's families
- `POST /api/user/families` - Create new family
- `POST /api/user/families/:familyId/invite` - Invite family member
- `PUT /api/user/families/:familyId/members/:memberId` - Update member permissions

## 📱 Usage Guide

### Getting Started
1. **Register**: Create an account or sign in with Google
2. **Create Family**: Set up your family profile
3. **Add Baby**: Add your baby's information and birth details
4. **Start Tracking**: Begin logging activities like feeding, sleeping, and diaper changes

### Tracking Activities
- **Feeding**: Log breastfeeding, bottle feeding, or solid foods with duration and amounts
- **Sleep**: Track sleep sessions with start/end times and quality ratings
- **Diaper Changes**: Record diaper types and note any rashes or concerns
- **Mood**: Monitor your baby's emotional state and potential triggers
- **Health**: Track symptoms, medications, and doctor visits

### Family Collaboration
- **Invite Partner**: Send invitation links to your partner or caregivers
- **Set Permissions**: Control who can view, edit, or manage family data
- **Real-time Updates**: See activities logged by other family members instantly

### Calendar Integration
- **Connect Google**: Link your Google account for calendar sync
- **Sync Activities**: Choose which activities to sync to your calendar
- **View Patterns**: See your baby's schedule alongside your family calendar

### Analytics & Insights
- **Daily Summaries**: View today's activities at a glance
- **Weekly Reports**: Analyze patterns in sleep, feeding, and mood
- **Growth Charts**: Track weight and length over time
- **Export Data**: Generate reports for pediatrician visits

## 🔒 Security Features

- **Password Encryption**: All passwords are hashed using bcrypt
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: API endpoints are protected against abuse
- **Input Validation**: All user inputs are validated and sanitized
- **CORS Protection**: Configured for secure cross-origin requests
- **Role-based Access**: Family members have appropriate permissions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, email support@babycare.app or create an issue in the repository.

## 🔮 Future Features

- Mobile app (React Native)
- Push notifications
- AI-powered insights and recommendations
- Integration with pediatric health records
- Multilingual support
- Offline data synchronization
- Baby development milestone reminders
- Photo and video attachment support
- Advanced analytics and reporting
- Integration with smart baby monitors

---

**Happy Parenting! 👶💙💗**

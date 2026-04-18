# Gems Academy - Student Management PWA

A Progressive Web Application for managing student mentoring, communication logs, and follow-up tracking at Gems Academy.

## Features

### 📱 Mobile-First Design
- Responsive design that works on all devices
- Touch-friendly interface optimized for mobile phones
- Installable as a native app on smartphones
- Offline functionality with data synchronization

### 👥 Student Management
- Complete student profiles with all required information
- Quick search and filtering capabilities
- Easy-to-use forms for adding and editing students
- Student data includes:
  - Name, Class, School, Place
  - Gems joining year
  - Mobile numbers (primary and secondary)
  - Province, Parents' details
  - Siblings information
  - Remarks with dates

### 📞 Communication Features
- Call logging with duration and notes
- WhatsApp integration for direct messaging
- Communication history tracking
- Follow-up reminders
- Timeline view of all interactions

### 💾 Data Management
- Local storage for offline access
- CSV import for bulk student data
- CSV export for backup and reporting
- Auto-backup functionality
- Data validation and error handling

### 🎨 User Experience
- Dark and light theme support
- System theme detection
- Smooth animations and transitions
- Loading states and progress indicators
- Toast notifications for user feedback

## Installation

### As Web App
1. Open the application in your browser
2. Click the install prompt (if available)
3. Add to home screen for easy access

### As PWA
1. Visit the application URL
2. Look for the install icon in your browser
3. Follow the installation prompts
4. The app will be available on your home screen

## Usage

### Adding Students
1. Navigate to the "Students" section
2. Click "Add Student" button
3. Fill in all required fields (marked with *)
4. Add optional information as needed
5. Save to create the student profile

### Communication Logging
1. Go to "Communication" section
2. Click "Add Log" button
3. Select the student from dropdown
4. Choose communication type (Call, WhatsApp, Meeting)
5. Add date, time, duration, and notes
6. Save to log the interaction

### Making Calls/WhatsApp
1. Find the student in the list
2. Click the phone icon for direct call
3. Click the WhatsApp icon for messaging
4. Communication is automatically logged

### Import/Export Data
1. Go to "Import/Export" section
2. For import: Drag and drop CSV file or click to browse
3. For export: Choose what to export (Students, Communication, or All)
4. Downloaded files can be used for backup or analysis

## CSV Format

### Student Import
Required columns: `name`, `class`, `school`, `place`, `gemsJoiningYear`, `mobile1`

Optional columns: `mobile2`, `province`, `fathersName`, `fathersOccupation`, `mothersName`, `mothersOccupation`, `siblings`, `remarks`

### Communication Export
Columns: `studentId`, `studentName`, `type`, `date`, `time`, `duration`, `notes`

## Browser Support

### Recommended Browsers
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### PWA Features Support
- Service Workers: Chrome, Firefox, Edge
- Install Prompt: Chrome, Edge
- Background Sync: Chrome, Edge
- Push Notifications: Chrome, Firefox, Edge

## Security

### Data Privacy
- All data stored locally in browser
- No external data transmission
- No third-party tracking
- Offline-first architecture

### Best Practices
- Regular data export for backup
- Use secure connections when available
- Keep browser updated for security patches
- Clear data when shared device usage

## Troubleshooting

### Common Issues

**App not installing:**
- Check browser compatibility
- Ensure HTTPS connection (required for PWA)
- Clear browser cache and try again

**Data not saving:**
- Check browser storage permissions
- Clear browser cache if full
- Try exporting data as backup

**Offline issues:**
- Ensure service worker is registered
- Check browser console for errors
- Refresh the page to re-register service worker

### Performance Tips
- Keep student records under 1000 for optimal performance
- Regular export and cleanup of old data
- Use modern browsers for best experience

## Development

### Local Setup
1. Clone or download the repository
2. Serve files using HTTP server (required for PWA)
3. Access via `http://localhost` or similar

### File Structure
```
/
├── index.html              # Main application
├── css/                    # Stylesheets
│   ├── styles.css          # Main styles
│   ├── themes.css          # Theme system
│   └── responsive.css     # Mobile responsive
├── js/                     # JavaScript modules
│   ├── storage.js          # Data management
│   ├── csv.js              # Import/export
│   ├── ui.js               # UI interactions
│   ├── app.js              # Main application
│   └── pwa.js              # PWA features
├── assets/                 # Static assets
├── manifest.json           # PWA manifest
├── sw.js                  # Service worker
└── README.md              # This file
```

## Features Roadmap

### Upcoming Features
- [ ] Cloud sync integration
- [ ] Advanced reporting dashboard
- [ ] Email integration
- [ ] Calendar integration
- [ ] Multi-language support
- [ ] Advanced search filters
- [ ] Bulk operations
- [ ] Data analytics
- [ ] Parent portal access
- [ ] SMS integration

### Technical Improvements
- [ ] IndexedDB for larger datasets
- [ ] Web Workers for heavy operations
- [ ] Progressive image loading
- [ ] Advanced caching strategies
- [ ] Performance monitoring

## Support

For support, feature requests, or bug reports:
1. Check the troubleshooting section above
2. Verify browser compatibility
3. Test with a fresh browser profile
4. Report issues with detailed information

## License

This project is proprietary to Gems Academy. All rights reserved.

---

**Gems Academy** - Empowering students through effective mentoring and communication management.

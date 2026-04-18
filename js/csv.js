// Gems Academy - CSV Import/Export Functionality
class CSVManager {
    constructor() {
        this.STUDENT_HEADERS = [
            'name', 'class', 'school', 'place', 'gemsJoiningYear',
            'mobile1', 'mobile2', 'province', 'fathersName', 'fathersOccupation',
            'mothersName', 'mothersOccupation', 'siblings', 'remarks'
        ];
        
        this.COMMUNICATION_HEADERS = [
            'studentId', 'studentName', 'type', 'date', 'time', 'duration', 'notes'
        ];
    }

    // Parse CSV string to array of objects
    parseCSV(csvString, delimiter = ',') {
        const lines = csvString.split('\n').filter(line => line.trim());
        if (lines.length === 0) return [];

        const headers = this.parseCSVLine(lines[0], delimiter);
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i], delimiter);
            if (values.length === headers.length) {
                const obj = {};
                headers.forEach((header, index) => {
                    obj[header] = values[index] || '';
                });
                data.push(obj);
            }
        }

        return { headers, data };
    }

    // Parse a single CSV line handling quoted fields
    parseCSVLine(line, delimiter) {
        const result = [];
        let current = '';
        let inQuotes = false;
        let i = 0;

        while (i < line.length) {
            const char = line[i];
            const nextChar = line[i + 1];

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    // Escaped quote
                    current += '"';
                    i += 2;
                } else {
                    // Toggle quote mode
                    inQuotes = !inQuotes;
                    i++;
                }
            } else if (char === delimiter && !inQuotes) {
                // Field separator
                result.push(current.trim());
                current = '';
                i++;
            } else {
                current += char;
                i++;
            }
        }

        // Add the last field
        result.push(current.trim());
        return result;
    }

    // Convert array of objects to CSV string
    arrayToCSV(data, headers) {
        if (!data || data.length === 0) return '';

        const csvLines = [headers.join(',')];

        data.forEach(row => {
            const values = headers.map(header => {
                const value = row[header] || '';
                return this.escapeCSVField(value);
            });
            csvLines.push(values.join(','));
        });

        return csvLines.join('\n');
    }

    // Escape CSV field if it contains special characters
    escapeCSVField(field) {
        if (field === null || field === undefined) return '';
        
        const str = field.toString();
        
        // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return '"' + str.replace(/"/g, '""') + '"';
        }
        
        return str;
    }

    // Export students to CSV
    exportStudents(students) {
        const csvData = students.map(student => {
            // Flatten remarks for CSV export
            const remarks = student.remarks && student.remarks.length > 0
                ? student.remarks.map(r => `${r.date}: ${r.remark}`).join('; ')
                : '';
            
            return {
                ...student,
                remarks
            };
        });

        return this.arrayToCSV(csvData, this.STUDENT_HEADERS);
    }

    // Export communication logs to CSV
    exportCommunication(communication, students) {
        const studentMap = new Map();
        students.forEach(student => {
            studentMap.set(student.id, student.name);
        });

        const csvData = communication.map(log => ({
            ...log,
            studentName: studentMap.get(log.studentId) || 'Unknown'
        }));

        return this.arrayToCSV(csvData, this.COMMUNICATION_HEADERS);
    }

    // Import students from CSV
    importStudents(csvString) {
        try {
            const { headers, data } = this.parseCSV(csvString);
            const students = [];
            const errors = [];

            // Validate headers
            const requiredHeaders = ['name', 'class', 'school', 'place', 'gemsJoiningYear', 'mobile1'];
            const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
            
            if (missingHeaders.length > 0) {
                throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
            }

            data.forEach((row, index) => {
                try {
                    const student = {
                        name: row.name || '',
                        class: row.class || '',
                        school: row.school || '',
                        place: row.place || '',
                        gemsJoiningYear: row.gemsJoiningYear || new Date().getFullYear().toString(),
                        mobile1: row.mobile1 || '',
                        mobile2: row.mobile2 || '',
                        province: row.province || '',
                        fathersName: row.fathersName || '',
                        fathersOccupation: row.fathersOccupation || '',
                        mothersName: row.mothersName || '',
                        mothersOccupation: row.mothersOccupation || '',
                        siblings: row.siblings || '',
                        remarks: this.parseRemarks(row.remarks || '')
                    };

                    // Validate required fields
                    if (!student.name || !student.class || !student.school || 
                        !student.place || !student.mobile1) {
                        errors.push(`Row ${index + 1}: Missing required fields`);
                        return;
                    }

                    // Validate mobile number format
                    if (!this.isValidMobile(student.mobile1)) {
                        errors.push(`Row ${index + 1}: Invalid mobile number format`);
                        return;
                    }

                    if (student.mobile2 && !this.isValidMobile(student.mobile2)) {
                        errors.push(`Row ${index + 1}: Invalid second mobile number format`);
                        return;
                    }

                    students.push(student);
                } catch (error) {
                    errors.push(`Row ${index + 1}: ${error.message}`);
                }
            });

            return { students, errors };
        } catch (error) {
            throw new Error(`Failed to parse CSV: ${error.message}`);
        }
    }

    // Parse remarks from CSV format
    parseRemarks(remarksString) {
        if (!remarksString) return [];
        
        const remarks = [];
        const parts = remarksString.split(';');
        
        parts.forEach(part => {
            const match = part.match(/(\d{4}-\d{2}-\d{2}):\s*(.+)/);
            if (match) {
                remarks.push({
                    date: match[1],
                    remark: match[2].trim()
                });
            }
        });

        return remarks;
    }

    // Validate mobile number format
    isValidMobile(mobile) {
        if (!mobile) return false;
        
        // Remove all non-digit characters
        const clean = mobile.replace(/\D/g, '');
        
        // Check if it's a valid length (10-15 digits)
        return clean.length >= 10 && clean.length <= 15;
    }

    // Download CSV file
    downloadCSV(csvContent, filename) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } else {
            throw new Error('Your browser does not support downloading files');
        }
    }

    // Read CSV file
    readCSVFile(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error('No file selected'));
                return;
            }

            if (!file.name.toLowerCase().endsWith('.csv')) {
                reject(new Error('Please select a CSV file'));
                return;
            }

            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const csvContent = e.target.result;
                    resolve(csvContent);
                } catch (error) {
                    reject(new Error('Failed to read file content'));
                }
            };

            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };

            reader.readAsText(file);
        });
    }

    // Generate filename with timestamp
    generateFilename(prefix, extension = 'csv') {
        const now = new Date();
        const timestamp = now.toISOString()
            .replace(/[:.]/g, '-')
            .replace('T', '_')
            .slice(0, -5);
        return `${prefix}_${timestamp}.${extension}`;
    }

    // Validate CSV structure
    validateCSVStructure(headers, type) {
        const expectedHeaders = type === 'students' 
            ? this.STUDENT_HEADERS 
            : this.COMMUNICATION_HEADERS;
        
        const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
        const extraHeaders = headers.filter(h => !expectedHeaders.includes(h));
        
        return {
            isValid: missingHeaders.length === 0,
            missingHeaders,
            extraHeaders,
            expectedHeaders
        };
    }

    // Create sample CSV for students
    createSampleStudentCSV() {
        const sampleData = [
            {
                name: 'John Doe',
                class: 'Grade 10',
                school: 'Example High School',
                place: 'New York',
                gemsJoiningYear: '2024',
                mobile1: '+1234567890',
                mobile2: '+0987654321',
                province: 'New York',
                fathersName: 'Robert Doe',
                fathersOccupation: 'Engineer',
                mothersName: 'Jane Doe',
                mothersOccupation: 'Teacher',
                siblings: '2 sisters',
                remarks: '2024-01-15: Good progress in mathematics; 2024-02-01: Needs help with science project'
            }
        ];

        return this.arrayToCSV(sampleData, this.STUDENT_HEADERS);
    }

    // Create sample CSV for communication
    createSampleCommunicationCSV() {
        const sampleData = [
            {
                studentId: 'id_1234567890_abc123',
                studentName: 'John Doe',
                type: 'call',
                date: '2024-01-15',
                time: '10:30',
                duration: '15 minutes',
                notes: 'Discussed progress in mathematics'
            }
        ];

        return this.arrayToCSV(sampleData, this.COMMUNICATION_HEADERS);
    }
}

// Global CSV manager instance
const csvManager = new CSVManager();

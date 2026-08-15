// components/CertificatePDF.tsx
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

interface CertificatePDFProps {
  userName: string
  courseTitle: string
  completionDate: string
  certificateId: string
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
  },
  border: {
    border: '2px solid #d97706',
    padding: 30,
    borderRadius: 8,
  },
  header: {
    textAlign: 'center',
    marginBottom: 20,
  },
  seal: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a2e',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  name: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a2e',
    textAlign: 'center',
    marginBottom: 10,
    paddingVertical: 10,
    borderBottom: '1px solid #d97706',
    borderTop: '1px solid #d97706',
  },
  courseTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563eb',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  date: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  footer: {
    marginTop: 20,
    paddingTop: 20,
    borderTop: '1px solid #e5e7eb',
    textAlign: 'center',
  },
  footerText: {
    fontSize: 10,
    color: '#9ca3af',
  },
  certificateId: {
    fontSize: 10,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 10,
  },
})

export default function CertificatePDF({ 
  userName, 
  courseTitle, 
  completionDate, 
  certificateId 
}: CertificatePDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.border}>
          <View style={styles.header}>
            <Text style={styles.seal}>🏆</Text>
            <Text style={styles.title}>CERTIFICATE OF COMPLETION</Text>
            <Text style={styles.subtitle}>Proudly presented to</Text>
          </View>
          
          <Text style={styles.name}>{userName}</Text>
          
          <Text style={styles.description}>has successfully completed</Text>
          
          <Text style={styles.courseTitle}>{courseTitle}</Text>
          
          <Text style={styles.date}>On this day, {completionDate}</Text>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>Stratavax Academy</Text>
            <Text style={styles.certificateId}>Certificate ID: {certificateId}</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}

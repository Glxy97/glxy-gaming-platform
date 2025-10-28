import { Metadata } from 'next';
import ApiDocsViewer from '../../components/dev/ApiDocsViewer';

export const metadata: Metadata = {
  title: 'API Documentation - GLXY Gaming Platform',
  description: 'Comprehensive API documentation for the GLXY Gaming Platform with real-time multiplayer capabilities',
};

export default function DocsPage() {
  return <ApiDocsViewer />;
}
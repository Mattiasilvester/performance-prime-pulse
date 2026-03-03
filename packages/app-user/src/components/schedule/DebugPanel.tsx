import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChevronDown, ChevronUp, FileText, Eye, AlertTriangle, Info } from 'lucide-react';

interface DebugInfo {
  textPreview: string;
  extractionSource: string;
  extractionStatus: string;
  reason: string;
}

interface DebugPanelProps {
  debugInfo?: DebugInfo;
  warnings: string[];
  confidence: number;
  extractionSource: string;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  debugInfo,
  warnings,
  confidence,
  extractionSource
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!debugInfo) return null;

  const getConfidenceColor = (conf: number) => {
    if (conf >= 80) return 'bg-green-100 text-green-800';
    if (conf >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getExtractionStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS': return 'bg-green-100 text-green-800';
      case 'EMPTY_TEXT': return 'bg-red-100 text-red-800';
      case 'EMPTY_TEXT_AFTER_OCR': return 'bg-orange-100 text-orange-800';
      case 'ERROR': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="mt-4 border-orange-200 bg-orange-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Info className="h-4 w-4" />
            Debug Analysis
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6 p-0"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Status Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Source:</span>
              <Badge variant="outline" className="ml-2">
                {extractionSource}
              </Badge>
            </div>
            <div>
              <span className="font-medium">Status:</span>
              <Badge className={`ml-2 ${getExtractionStatusColor(debugInfo.extractionStatus)}`}>
                {debugInfo.extractionStatus}
              </Badge>
            </div>
            <div>
              <span className="font-medium">Confidence:</span>
              <Badge className={`ml-2 ${getConfidenceColor(confidence)}`}>
                {confidence}%
              </Badge>
            </div>
            <div>
              <span className="font-medium">Time:</span>
              <span className="ml-2 text-gray-600">{debugInfo.reason}</span>
            </div>
          </div>

          {/* Warnings */}
          {warnings.length > 0 && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <div className="space-y-1">
                  {warnings.map((warning, index) => (
                    <div key={index} className="text-sm">• {warning}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Text Preview */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4" />
              <span className="font-medium text-sm">Text Preview (first 600 chars):</span>
            </div>
            <div className="bg-white border rounded-md p-3 text-xs font-mono max-h-32 overflow-y-auto">
              {debugInfo.textPreview || 'No text extracted'}
            </div>
          </div>

          {/* Extraction Details */}
          <div className="text-xs text-gray-600 space-y-1">
            <div><strong>Extraction Source:</strong> {debugInfo.extractionSource}</div>
            <div><strong>Extraction Status:</strong> {debugInfo.extractionStatus}</div>
            <div><strong>Processing Time:</strong> {debugInfo.reason}</div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

import { useState } from 'react';
import { 
  FileText, 
  Upload, 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Link,
  Hash,
  Image,
  Mail,
  Loader2,
  Bug,
  ScanSearch,
  ListTree
} from 'lucide-react';
import { Evidence } from '@/types/complaint';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface EvidencePanelProps {
  evidence: Evidence[];
}

export function EvidencePanel({ evidence }: EvidencePanelProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [scanningItems, setScanningItems] = useState<Set<string>>(new Set());

  const getScanIcon = (status: Evidence['scanStatus']) => {
    switch (status) {
      case 'clean':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'malicious':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'scanning':
        return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      default:
        return <Shield className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const handleSendToSandbox = (file: Evidence) => {
    toast({
      title: "Sent to Sandbox",
      description: `${file.fileName} has been submitted for sandbox analysis.`,
    });
  };

  const handleScanWithClamAV = (file: Evidence) => {
    setScanningItems(prev => new Set(prev).add(file.id));
    setTimeout(() => {
      setScanningItems(prev => {
        const next = new Set(prev);
        next.delete(file.id);
        return next;
      });
      toast({
        title: "Scan Complete",
        description: `ClamAV scan completed for ${file.fileName}.`,
      });
    }, 2000);
  };

  const handleGenerateIoC = () => {
    toast({
      title: "IoC List Generated",
      description: "Indicators of Compromise have been extracted and compiled.",
    });
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-secondary/20">
        <h3 className="font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Evidence Files
          <span className="text-xs text-muted-foreground">({evidence.length})</span>
        </h3>
        <Button size="sm" variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Upload
        </Button>
      </div>

      {/* Action Buttons */}
      <div className="px-5 py-3 border-b border-border bg-secondary/10">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => handleSendToSandbox(evidence[0])}>
            <Bug className="h-4 w-4 mr-2" />
            Send to Sandbox
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleScanWithClamAV(evidence[0])}>
            <ScanSearch className="h-4 w-4 mr-2" />
            Scan with ClamAV
          </Button>
          <Button size="sm" variant="outline" onClick={handleGenerateIoC}>
            <ListTree className="h-4 w-4 mr-2" />
            Generate IoC List
          </Button>
        </div>
      </div>

      {/* Evidence List */}
      <div className="p-4">
        {evidence.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No evidence files uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {evidence.map((file) => {
              const isExpanded = expandedItems.has(file.id);
              const isScanning = scanningItems.has(file.id);
              
              return (
                <div 
                  key={file.id}
                  className={cn(
                    "rounded-lg border transition-colors",
                    file.scanStatus === 'malicious' && "border-destructive/50 bg-destructive/5"
                  )}
                >
                  {/* File Header */}
                  <button
                    onClick={() => toggleExpand(file.id)}
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-secondary">
                      <FileText className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.fileName}</p>
                      <p className="text-xs text-muted-foreground">{file.size}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {isScanning ? (
                        <Loader2 className="h-4 w-4 text-primary animate-spin" />
                      ) : (
                        getScanIcon(file.scanStatus)
                      )}
                      <span className={cn(
                        "text-xs font-medium capitalize",
                        file.scanStatus === 'clean' && "text-success",
                        file.scanStatus === 'malicious' && "text-destructive",
                        file.scanStatus === 'pending' && "text-muted-foreground"
                      )}>
                        {isScanning ? 'Scanning...' : file.scanStatus}
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Metadata */}
                  {isExpanded && file.metadata && (
                    <div className="px-3 pb-3 space-y-3 border-t border-border/50">
                      {/* OCR Text */}
                      {file.metadata.ocrText && (
                        <div className="pt-3">
                          <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                            <FileText className="h-3 w-3" /> OCR Extracted Text
                          </p>
                          <p className="text-xs bg-secondary p-2 rounded font-mono">{file.metadata.ocrText}</p>
                        </div>
                      )}

                      {/* AI Tags */}
                      {file.metadata.aiTags && file.metadata.aiTags.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">AI Tags</p>
                          <div className="flex flex-wrap gap-1">
                            {file.metadata.aiTags.map((tag, i) => (
                              <span key={i} className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* URLs & Domains */}
                      {(file.metadata.extractedUrls?.length || file.metadata.extractedDomains?.length) ? (
                        <div className="grid grid-cols-2 gap-3">
                          {file.metadata.extractedUrls && file.metadata.extractedUrls.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                                <Link className="h-3 w-3" /> URLs
                              </p>
                              <div className="space-y-1">
                                {file.metadata.extractedUrls.map((url, i) => (
                                  <code key={i} className="block text-xs bg-secondary px-2 py-0.5 rounded truncate">
                                    {url}
                                  </code>
                                ))}
                              </div>
                            </div>
                          )}
                          {file.metadata.extractedDomains && file.metadata.extractedDomains.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Domains</p>
                              <div className="space-y-1">
                                {file.metadata.extractedDomains.map((domain, i) => (
                                  <code key={i} className="block text-xs bg-secondary px-2 py-0.5 rounded">
                                    {domain}
                                  </code>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : null}

                      {/* Hashes */}
                      {file.metadata.hashes && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                            <Hash className="h-3 w-3" /> File Hashes
                          </p>
                          <div className="space-y-1 font-mono text-xs">
                            {file.metadata.hashes.md5 && (
                              <div className="flex gap-2">
                                <span className="text-muted-foreground w-12">MD5:</span>
                                <code className="bg-secondary px-1 rounded truncate">{file.metadata.hashes.md5}</code>
                              </div>
                            )}
                            {file.metadata.hashes.sha1 && (
                              <div className="flex gap-2">
                                <span className="text-muted-foreground w-12">SHA1:</span>
                                <code className="bg-secondary px-1 rounded truncate">{file.metadata.hashes.sha1}</code>
                              </div>
                            )}
                            {file.metadata.hashes.sha256 && (
                              <div className="flex gap-2">
                                <span className="text-muted-foreground w-12">SHA256:</span>
                                <code className="bg-secondary px-1 rounded truncate">{file.metadata.hashes.sha256}</code>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* EXIF Data */}
                      {file.metadata.exifData && Object.keys(file.metadata.exifData).length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                            <Image className="h-3 w-3" /> EXIF Data
                          </p>
                          <div className="grid grid-cols-2 gap-1 text-xs">
                            {Object.entries(file.metadata.exifData).map(([key, value]) => (
                              <div key={key} className="flex gap-1">
                                <span className="text-muted-foreground">{key}:</span>
                                <span>{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Email Headers */}
                      {file.metadata.emailHeaders && Object.keys(file.metadata.emailHeaders).length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                            <Mail className="h-3 w-3" /> Email Headers
                          </p>
                          <div className="space-y-1 text-xs bg-secondary p-2 rounded">
                            {Object.entries(file.metadata.emailHeaders).map(([key, value]) => (
                              <div key={key} className="flex gap-2">
                                <span className="text-muted-foreground font-medium min-w-[80px]">{key}:</span>
                                <span className="truncate">{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Malware Alert */}
      {evidence.some(e => e.scanReport) && (
        <div className="mx-4 mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
          <p className="text-xs font-medium text-destructive mb-1">Malware Detected</p>
          <p className="text-xs text-muted-foreground">
            {evidence.find(e => e.scanReport)?.scanReport}
          </p>
        </div>
      )}
    </div>
  );
}

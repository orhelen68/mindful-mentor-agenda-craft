import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface JSONBinCredentialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCredentialsSet: (credentials: JSONBinCredentials) => void;
  type: 'requirements' | 'modules';
}

export interface JSONBinCredentials {
  masterKey: string;
  binId: string;
}

export function JSONBinCredentialsDialog({ 
  open, 
  onOpenChange, 
  onCredentialsSet, 
  type 
}: JSONBinCredentialsDialogProps) {
  const [masterKey, setMasterKey] = useState('');
  const [binId, setBinId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!masterKey.trim() || !binId.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both Master Key and Bin ID",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const credentials: JSONBinCredentials = {
        masterKey: masterKey.trim(),
        binId: binId.trim(),
      };

      // Store in localStorage
      const storageKey = type === 'requirements' ? 'jsonbin_requirements_credentials' : 'jsonbin_modules_credentials';
      localStorage.setItem(storageKey, JSON.stringify(credentials));

      onCredentialsSet(credentials);
      onOpenChange(false);
      
      toast({
        title: "Credentials Saved",
        description: `JSONBin credentials for ${type} have been saved successfully.`,
      });
    } catch (error) {
      console.error('Error saving credentials:', error);
      toast({
        title: "Error",
        description: "Failed to save credentials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setMasterKey('');
    setBinId('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>JSONBin Configuration</DialogTitle>
          <DialogDescription>
            Enter your JSONBin.io credentials to access {type === 'requirements' ? 'training requirements' : 'training modules'}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="masterKey">Master Key</Label>
            <Input
              id="masterKey"
              type="password"
              placeholder="Enter your JSONBin Master Key"
              value={masterKey}
              onChange={(e) => setMasterKey(e.target.value)}
              className="col-span-3"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="binId">Bin ID</Label>
            <Input
              id="binId"
              placeholder={`Enter Bin ID for ${type}`}
              value={binId}
              onChange={(e) => setBinId(e.target.value)}
              className="col-span-3"
            />
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">Default values:</p>
            <p className="text-xs font-mono">Master Key: $2a$10$APsAMK9yLPqFiHvrQNKQFOn0hk5QPCpPsZxGaU8us20ul28TMFMyO</p>
            <p className="text-xs font-mono">
              {type === 'requirements' ? 'Requirements Bin ID: 687df942d1981e22d1898301' : 'Modules Bin ID: 687df9652d1dfe3c2c75a066'}
            </p>
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save & Connect'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
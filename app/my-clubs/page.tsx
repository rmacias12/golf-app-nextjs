'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth, SignInButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Club, ArrowLeft, Plus, Trash2, Edit2, Save, X, Lock, Settings2, ChevronDown, ChevronUp } from 'lucide-react';
import { getAllClubs, getUserClubs, addUserClub, updateUserClub, deleteUserClub } from '@/app/db/actions';

interface UserClubWithDetails {
  id: number;
  userId: string;
  clubId: number;
  customDistance: number | null;
  customBrand: string | null;
  customLoft: number | null;
  shaftType: string | null;
  shaftFlex: string | null;
  gripType: string | null;
  clubLength: string | null;
  lieAngle: string | null;
  condition: string | null;
  purchaseYear: number | null;
  active: boolean;
  notes: string | null;
  club: {
    id: number;
    name: string;
    type: string;
    brand: string | null;
    category: string;
    defaultDistance: number | null;
    loft: number | null;
  };
}

interface AvailableClub {
  id: number;
  name: string;
  type: string;
  category: string;
  defaultDistance: number | null;
  loft: number | null;
}

// Options for dropdowns
const shaftTypes = ['Steel', 'Graphite', 'Multi-Material'];
const shaftFlexes = ['X-Stiff', 'Stiff', 'Regular', 'Senior', 'Ladies'];
const gripTypes = ['Standard', 'Midsize', 'Jumbo', 'Oversize'];
const clubLengths = ['+1.0', '+0.5', 'Standard', '-0.5', '-1.0'];
const lieAngles = ['+2°', '+1°', 'Standard', '-1°', '-2°'];
const conditions = ['New', 'Excellent', 'Good', 'Fair', 'Worn'];

export default function MyClubsPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const [userClubs, setUserClubs] = useState<UserClubWithDetails[]>([]);
  const [availableClubs, setAvailableClubs] = useState<AvailableClub[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [expandedSpecs, setExpandedSpecs] = useState<number | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    customDistance: '',
    customBrand: '',
    customLoft: '',
    shaftType: '',
    shaftFlex: '',
    gripType: '',
    clubLength: '',
    lieAngle: '',
    condition: '',
    purchaseYear: '',
    notes: '',
  });

  // Add form state
  const [selectedClubId, setSelectedClubId] = useState('');
  const [addForm, setAddForm] = useState({
    customDistance: '',
    customBrand: '',
    customLoft: '',
    shaftType: '',
    shaftFlex: '',
    gripType: '',
    clubLength: '',
    lieAngle: '',
    condition: '',
    purchaseYear: new Date().getFullYear().toString(),
    notes: '',
  });

  const loadData = useCallback(async () => {
    if (!isSignedIn) return;

    setLoading(true);
    try {
      const [userData, allClubs] = await Promise.all([
        getUserClubs(),
        getAllClubs(),
      ]);

      // Type assertion since we're getting joined data
      setUserClubs(userData as unknown as UserClubWithDetails[]);

      // Filter out clubs already in user's bag
      const userClubIds = new Set(userData.map(uc => uc.clubId));
      const available = allClubs.filter(c => !userClubIds.has(c.id));
      setAvailableClubs(available);
    } catch (error) {
      console.error('Failed to load clubs:', error);
    } finally {
      setLoading(false);
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      loadData();
    } else if (isLoaded) {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, loadData]);

  const handleEdit = (club: UserClubWithDetails) => {
    setEditingId(club.id);
    setEditForm({
      customDistance: club.customDistance?.toString() || club.club.defaultDistance?.toString() || '',
      customBrand: club.customBrand || '',
      customLoft: club.customLoft?.toString() || '',
      shaftType: club.shaftType || '',
      shaftFlex: club.shaftFlex || '',
      gripType: club.gripType || '',
      clubLength: club.clubLength || '',
      lieAngle: club.lieAngle || '',
      condition: club.condition || '',
      purchaseYear: club.purchaseYear?.toString() || '',
      notes: club.notes || '',
    });
  };

  const handleSave = async (id: number) => {
    try {
      await updateUserClub(id, {
        customDistance: parseInt(editForm.customDistance) || 0,
        customBrand: editForm.customBrand || undefined,
        customLoft: editForm.customLoft ? parseInt(editForm.customLoft) : undefined,
        shaftType: editForm.shaftType || undefined,
        shaftFlex: editForm.shaftFlex || undefined,
        gripType: editForm.gripType || undefined,
        clubLength: editForm.clubLength || undefined,
        lieAngle: editForm.lieAngle || undefined,
        condition: editForm.condition || undefined,
        purchaseYear: editForm.purchaseYear ? parseInt(editForm.purchaseYear) : undefined,
        notes: editForm.notes || undefined,
      });
      setEditingId(null);
      loadData();
    } catch (error) {
      console.error('Failed to update club:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remove this club from your bag?')) return;
    try {
      await deleteUserClub(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete club:', error);
    }
  };

  const handleAddClub = async () => {
    if (!selectedClubId || !isSignedIn) return;

    try {
      await addUserClub({
        clubId: parseInt(selectedClubId),
        customDistance: parseInt(addForm.customDistance) || undefined,
        customBrand: addForm.customBrand || undefined,
        customLoft: addForm.customLoft ? parseInt(addForm.customLoft) : undefined,
        shaftType: addForm.shaftType || undefined,
        shaftFlex: addForm.shaftFlex || undefined,
        gripType: addForm.gripType || undefined,
        clubLength: addForm.clubLength || undefined,
        lieAngle: addForm.lieAngle || undefined,
        condition: addForm.condition || undefined,
        purchaseYear: addForm.purchaseYear ? parseInt(addForm.purchaseYear) : undefined,
        notes: addForm.notes || undefined,
      });
      setIsAddDialogOpen(false);
      setSelectedClubId('');
      setAddForm({
        customDistance: '',
        customBrand: '',
        customLoft: '',
        shaftType: '',
        shaftFlex: '',
        gripType: '',
        clubLength: '',
        lieAngle: '',
        condition: '',
        purchaseYear: new Date().getFullYear().toString(),
        notes: '',
      });
      loadData();
    } catch (error) {
      console.error('Failed to add club:', error);
    }
  };

  const selectedClub = availableClubs.find(c => c.id.toString() === selectedClubId);

  const hasCustomSpecs = (club: UserClubWithDetails) => {
    return club.customBrand || club.customLoft || club.shaftType || club.shaftFlex || club.gripType ||
           club.clubLength || club.lieAngle || club.condition || club.purchaseYear;
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-4xl mb-4">🏌️</div>
          <p className="text-muted-foreground">Loading your bag...</p>
        </div>
      </main>
    );
  }

  // Show sign-in prompt if not authenticated
  if (!isSignedIn) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Sign In Required</h2>
            <p className="text-muted-foreground mb-6">
              Sign in to manage your personal club bag and track your game history.
            </p>
            <SignInButton mode="modal">
              <Button className="w-full h-12">
                Sign In to Continue
              </Button>
            </SignInButton>
            <Link href="/" className="block mt-4">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background flex flex-col p-4">
      <div className="max-w-md w-full mx-auto space-y-6">
        <div className="text-center space-y-2 pt-8">
          <div className="text-5xl mb-4">🏌️</div>
          <h1 className="text-3xl font-bold text-primary">My Clubs</h1>
          <p className="text-muted-foreground">
            {userClubs.length} clubs in your bag
          </p>
        </div>

        <div className="space-y-3 flex-1 overflow-auto">
          {userClubs.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-6 text-center">
                <Club className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground mb-2">Your bag is empty</p>
                <p className="text-sm text-muted-foreground">
                  Add clubs to build your custom bag
                </p>
              </CardContent>
            </Card>
          ) : (
            userClubs.map((userClub) => (
              <Card key={userClub.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  {/* Main Club Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-lg">{userClub.club.name}</p>
                        {hasCustomSpecs(userClub) && (
                          <Badge variant="secondary" className="text-xs">
                            <Settings2 className="h-3 w-3 mr-1" />
                            Custom
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {userClub.club.type} • {userClub.club.category}
                        {(userClub.customBrand || userClub.club.brand) && ` • ${userClub.customBrand || userClub.club.brand}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {editingId === userClub.id ? (
                        <>
                          <Input
                            type="number"
                            value={editForm.customDistance}
                            onChange={(e) => setEditForm({ ...editForm, customDistance: e.target.value })}
                            className="w-20 text-right"
                            placeholder="Yards"
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleSave(userClub.id)}
                          >
                            <Save className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setEditingId(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <div className="text-right">
                            <p className="font-medium text-primary">
                              {userClub.customDistance || userClub.club.defaultDistance || 0} yd
                            </p>
                            {userClub.customDistance && userClub.customDistance !== userClub.club.defaultDistance && (
                              <p className="text-xs text-muted-foreground">
                                Default: {userClub.club.defaultDistance} yd
                              </p>
                            )}
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(userClub)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(userClub.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Expandable Specs Section */}
                  {(hasCustomSpecs(userClub) || editingId === userClub.id) && (
                    <div className="mt-3 pt-3 border-t">
                      <button
                        onClick={() => setExpandedSpecs(expandedSpecs === userClub.id ? null : userClub.id)}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {expandedSpecs === userClub.id ? (
                          <><ChevronUp className="h-4 w-4" /> Hide Specs</>
                        ) : (
                          <><ChevronDown className="h-4 w-4" /> Show Specs</>
                        )}
                      </button>

                      {expandedSpecs === userClub.id && editingId !== userClub.id && (
                        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                          {userClub.customBrand && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Brand:</span>
                              <span>{userClub.customBrand}</span>
                            </div>
                          )}
                          {userClub.customLoft !== null && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Loft:</span>
                              <span>{userClub.customLoft > 0 ? '+' : ''}{userClub.customLoft}°</span>
                            </div>
                          )}
                          {userClub.shaftType && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Shaft:</span>
                              <span>{userClub.shaftType}</span>
                            </div>
                          )}
                          {userClub.shaftFlex && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Flex:</span>
                              <span>{userClub.shaftFlex}</span>
                            </div>
                          )}
                          {userClub.gripType && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Grip:</span>
                              <span>{userClub.gripType}</span>
                            </div>
                          )}
                          {userClub.clubLength && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Length:</span>
                              <span>{userClub.clubLength}</span>
                            </div>
                          )}
                          {userClub.lieAngle && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Lie:</span>
                              <span>{userClub.lieAngle}</span>
                            </div>
                          )}
                          {userClub.condition && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Condition:</span>
                              <span>{userClub.condition}</span>
                            </div>
                          )}
                          {userClub.purchaseYear && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Purchased:</span>
                              <span>{userClub.purchaseYear}</span>
                            </div>
                          )}
                          {userClub.notes && (
                            <div className="col-span-2 mt-1 pt-1 border-t">
                              <span className="text-muted-foreground">Notes:</span>
                              <p className="text-xs mt-1">{userClub.notes}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Edit Form */}
                      {editingId === userClub.id && (
                        <div className="mt-3 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Custom Brand</Label>
                              <Input
                                value={editForm.customBrand}
                                onChange={(e) => setEditForm({ ...editForm, customBrand: e.target.value })}
                                placeholder="e.g., TaylorMade"
                                className="text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Custom Loft (±°)</Label>
                              <Input
                                type="number"
                                value={editForm.customLoft}
                                onChange={(e) => setEditForm({ ...editForm, customLoft: e.target.value })}
                                placeholder="e.g., +1"
                                className="text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Shaft Type</Label>
                              <Select
                                value={editForm.shaftType}
                                onValueChange={(value) => setEditForm({ ...editForm, shaftType: value })}
                              >
                                <SelectTrigger className="text-sm">
                                  <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {shaftTypes.map(type => (
                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Shaft Flex</Label>
                              <Select
                                value={editForm.shaftFlex}
                                onValueChange={(value) => setEditForm({ ...editForm, shaftFlex: value })}
                              >
                                <SelectTrigger className="text-sm">
                                  <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {shaftFlexes.map(flex => (
                                    <SelectItem key={flex} value={flex}>{flex}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Grip Type</Label>
                              <Select
                                value={editForm.gripType}
                                onValueChange={(value) => setEditForm({ ...editForm, gripType: value })}
                              >
                                <SelectTrigger className="text-sm">
                                  <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {gripTypes.map(grip => (
                                    <SelectItem key={grip} value={grip}>{grip}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Club Length</Label>
                              <Select
                                value={editForm.clubLength}
                                onValueChange={(value) => setEditForm({ ...editForm, clubLength: value })}
                              >
                                <SelectTrigger className="text-sm">
                                  <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {clubLengths.map(length => (
                                    <SelectItem key={length} value={length}>{length}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Lie Angle</Label>
                              <Select
                                value={editForm.lieAngle}
                                onValueChange={(value) => setEditForm({ ...editForm, lieAngle: value })}
                              >
                                <SelectTrigger className="text-sm">
                                  <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {lieAngles.map(angle => (
                                    <SelectItem key={angle} value={angle}>{angle}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Condition</Label>
                              <Select
                                value={editForm.condition}
                                onValueChange={(value) => setEditForm({ ...editForm, condition: value })}
                              >
                                <SelectTrigger className="text-sm">
                                  <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {conditions.map(cond => (
                                    <SelectItem key={cond} value={cond}>{cond}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Purchase Year</Label>
                              <Input
                                type="number"
                                value={editForm.purchaseYear}
                                onChange={(e) => setEditForm({ ...editForm, purchaseYear: e.target.value })}
                                placeholder="e.g., 2023"
                                className="text-sm"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Notes</Label>
                            <Input
                              value={editForm.notes}
                              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                              placeholder="Any additional notes..."
                              className="text-sm"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="space-y-3 pt-4">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full h-12">
                <Plus className="mr-2 h-5 w-5" />
                Add Club to Bag
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Club to Your Bag</DialogTitle>
                <DialogDescription>
                  Select a club and customize its specs for your game.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Select Club</Label>
                  <Select value={selectedClubId} onValueChange={setSelectedClubId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a club..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableClubs.map((club) => (
                        <SelectItem key={club.id} value={club.id.toString()}>
                          {club.name} ({club.defaultDistance} yd)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedClub && (
                  <>
                    <div className="space-y-2">
                      <Label>Your Distance (yards)</Label>
                      <Input
                        type="number"
                        placeholder={`Default: ${selectedClub.defaultDistance} yd`}
                        value={addForm.customDistance}
                        onChange={(e) => setAddForm({ ...addForm, customDistance: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Leave blank to use default ({selectedClub.defaultDistance} yd)
                      </p>
                    </div>

                    <div className="pt-2 border-t">
                      <p className="text-sm font-medium mb-3">Custom Specs (Optional)</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Custom Brand</Label>
                          <Input
                            value={addForm.customBrand}
                            onChange={(e) => setAddForm({ ...addForm, customBrand: e.target.value })}
                            placeholder="e.g., TaylorMade"
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Custom Loft (±°)</Label>
                          <Input
                            type="number"
                            value={addForm.customLoft}
                            onChange={(e) => setAddForm({ ...addForm, customLoft: e.target.value })}
                            placeholder="e.g., +1"
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Shaft Type</Label>
                          <Select
                            value={addForm.shaftType}
                            onValueChange={(value) => setAddForm({ ...addForm, shaftType: value })}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              {shaftTypes.map(type => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Shaft Flex</Label>
                          <Select
                            value={addForm.shaftFlex}
                            onValueChange={(value) => setAddForm({ ...addForm, shaftFlex: value })}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              {shaftFlexes.map(flex => (
                                <SelectItem key={flex} value={flex}>{flex}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Grip Type</Label>
                          <Select
                            value={addForm.gripType}
                            onValueChange={(value) => setAddForm({ ...addForm, gripType: value })}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              {gripTypes.map(grip => (
                                <SelectItem key={grip} value={grip}>{grip}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Club Length</Label>
                          <Select
                            value={addForm.clubLength}
                            onValueChange={(value) => setAddForm({ ...addForm, clubLength: value })}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              {clubLengths.map(length => (
                                <SelectItem key={length} value={length}>{length}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Lie Angle</Label>
                          <Select
                            value={addForm.lieAngle}
                            onValueChange={(value) => setAddForm({ ...addForm, lieAngle: value })}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              {lieAngles.map(angle => (
                                <SelectItem key={angle} value={angle}>{angle}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Condition</Label>
                          <Select
                            value={addForm.condition}
                            onValueChange={(value) => setAddForm({ ...addForm, condition: value })}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              {conditions.map(cond => (
                                <SelectItem key={cond} value={cond}>{cond}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Purchase Year</Label>
                          <Input
                            type="number"
                            value={addForm.purchaseYear}
                            onChange={(e) => setAddForm({ ...addForm, purchaseYear: e.target.value })}
                            placeholder="e.g., 2023"
                            className="text-sm"
                          />
                        </div>
                      </div>
                      <div className="space-y-1 mt-3">
                        <Label className="text-xs">Notes</Label>
                        <Input
                          value={addForm.notes}
                          onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                          placeholder="Any additional notes..."
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </>
                )}

                <Button
                  onClick={handleAddClub}
                  disabled={!selectedClubId}
                  className="w-full"
                >
                  Add to Bag
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Link href="/" className="block">
            <Button variant="ghost" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}

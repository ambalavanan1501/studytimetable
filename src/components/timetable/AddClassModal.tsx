import { useState } from 'react';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface AddClassModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function AddClassModal({ isOpen, onClose, onSuccess }: AddClassModalProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        subject_name: '',
        subject_code: '',
        type: 'theory',
        room_number: '',
        day: 'Monday',
        start_time: '',
        end_time: '',
    });

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        if (!user) return;
        setLoading(true);

        try {
            const { error } = await supabase.from('timetable_entries').insert({
                user_id: user.id,
                ...formData
            });

            if (error) throw error;

            onSuccess();
            onClose();
            // Reset form
            setFormData({
                subject_name: '',
                subject_code: '',
                type: 'theory',
                room_number: '',
                day: 'Monday',
                start_time: '',
                end_time: '',
            });
        } catch (error) {
            console.error('Error adding class:', error);
            alert('Failed to add class');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Class Manually">
            <div className="space-y-4 p-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Subject Name</label>
                        <Input
                            value={formData.subject_name}
                            onChange={(e) => handleChange('subject_name', e.target.value)}
                            placeholder="e.g. Calculus"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Subject Code</label>
                        <Input
                            value={formData.subject_code}
                            onChange={(e) => handleChange('subject_code', e.target.value)}
                            placeholder="MAT1001"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Type</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            value={formData.type}
                            onChange={(e) => handleChange('type', e.target.value)}
                        >
                            <option value="theory">Theory</option>
                            <option value="lab">Lab</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Room</label>
                        <Input
                            value={formData.room_number}
                            onChange={(e) => handleChange('room_number', e.target.value)}
                            placeholder="SJT 101"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Day</label>
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        value={formData.day}
                        onChange={(e) => handleChange('day', e.target.value)}
                    >
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                            <option key={day} value={day}>{day}</option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Start Time</label>
                        <Input
                            type="time"
                            value={formData.start_time}
                            onChange={(e) => handleChange('start_time', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">End Time</label>
                        <Input
                            type="time"
                            value={formData.end_time}
                            onChange={(e) => handleChange('end_time', e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit} isLoading={loading} disabled={loading || !formData.subject_name || !formData.start_time}>
                        Add Class
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

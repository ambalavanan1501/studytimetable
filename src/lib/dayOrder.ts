export const getDayOrder = (date: string): string | null => {
    try {
        const stored = localStorage.getItem('day-orders');
        if (!stored) return null;
        const mappings = JSON.parse(stored);
        return mappings[date] || null;
    } catch (e) {
        console.error('Error reading day orders', e);
        return null;
    }
};

export const setDayOrder = (date: string, day: string) => {
    try {
        const stored = localStorage.getItem('day-orders');
        const mappings = stored ? JSON.parse(stored) : {};
        mappings[date] = day;
        localStorage.setItem('day-orders', JSON.stringify(mappings));
        // Dispatch event for reactive updates across components if needed, 
        // though standard React state or page refresh is often enough for this app.
        window.dispatchEvent(new Event('day-order-changed'));
    } catch (e) {
        console.error('Error saving day order', e);
    }
};

export const getAllDayOrders = (): Record<string, string> => {
    try {
        const stored = localStorage.getItem('day-orders');
        return stored ? JSON.parse(stored) : {};
    } catch (e) {
        return {};
    }
};

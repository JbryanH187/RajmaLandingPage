import { supabase } from "@/lib/supabase"

export const RESTAURANT_HOURS = {
    monday: { open: '13:00', close: '23:00' },
    tuesday: { open: '13:00', close: '23:00' },
    wednesday: { open: '13:00', close: '23:00' },
    thursday: { open: '13:00', close: '23:00' },
    friday: { open: '13:00', close: '23:59' }, // Late night
    saturday: { open: '13:00', close: '23:59' },
    sunday: { open: '13:00', close: '23:00' }
};

// DEV FLAG: Set to true to bypass schedule checks (always open unless manual close)
const DISABLE_HOURS_CHECK = true;

export interface RestaurantStatus {
    isOpen: boolean
    isTemporarilyClosed: boolean
    message: string | null
    nextOpenTime: string | null
}

export const RestaurantService = {
    async getStatus(): Promise<RestaurantStatus> {
        try {
            // 1. Check Database Config (Manual Override)
            const { data, error } = await supabase
                .from('restaurant_config')
                .select('*')
                .single()

            if (error) {
                // Supabase sometimes returns empty error objects or specific codes for missing data/tables
                const ignoreCodes = ['PGRST116', '42P01'];
                const shouldLog = error.code && !ignoreCodes.includes(error.code);

                if (shouldLog) {
                    console.error("Error fetching status", error)
                }
            }

            const dbRef = data || { is_temporarily_closed: false, closed_reason: null };

            // 2. Check Schedule Logic
            const now = new Date();
            const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
            const currentDay = days[now.getDay()];
            const currentTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }); // "14:30"

            const hours = RESTAURANT_HOURS[currentDay];
            const isWithinHours = DISABLE_HOURS_CHECK ? true : (currentTime >= hours.open && currentTime <= hours.close);

            // Determines final "Open" status
            // It is open IF: (Within Hours) AND (Not Temporarily Closed)
            const isOpen = isWithinHours && !dbRef.is_temporarily_closed;

            return {
                isOpen,
                isTemporarilyClosed: dbRef.is_temporarily_closed,
                message: dbRef.is_temporarily_closed ? (dbRef.closed_reason || "Cerrado temporalmente") : (!isWithinHours ? `Abrimos a las ${hours.open}` : null),
                nextOpenTime: !isWithinHours ? hours.open : null // Simplified logic
            }

        } catch (e) {
            console.error("Status check failed", e)
            return { isOpen: true, isTemporarilyClosed: false, message: null, nextOpenTime: null } // Fail open/gracefully
        }
    }
}

// src/routes/api/ping-database/+server.ts

import { json } from '@sveltejs/kit';
import { supabase } from '../../../lib/components/Supabase';

export async function POST() {
    try {
        // Simple query to ping the database
        const { error } = await supabase
            .from('notes')
            .select('id')
            .limit(1);

        if (error) {
            console.error('Error pinging database:', error);
            return json({ error: error.message }, { status: 500 });
        }

        // Log the ping for monitoring
        console.log(`Database pinged successfully at ${new Date().toISOString()}`);
        
        return json({ 
            status: 'success', 
            message: 'Database pinged successfully',
            timestamp: new Date().toISOString()
        }, { status: 200 });
    } catch (err) {
        console.error('Unexpected error:', err);
        return json({ 
            error: 'Unexpected error occurred', 
            details: (err as Error).message
        }, { status: 500 });
    }
}
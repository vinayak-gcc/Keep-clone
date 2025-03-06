import { json } from '@sveltejs/kit';
import { supabase } from '../../../lib/components/Supabase';

export async function GET() {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const { error } = await supabase
        .from('notes')
        .delete()
        .lte('updated_at', twoWeeksAgo.toISOString()) // Delete only old trashed notes
        .eq('trashed', true);

    if (error) {
        return json({ error: error.message }, { status: 500 });
    }

    return json({ message: 'Old trashed notes deleted' }, { status: 200 });
}

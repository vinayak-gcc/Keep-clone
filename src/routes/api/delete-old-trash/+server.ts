import { json } from '@sveltejs/kit';
import { supabase } from '../../../lib/components/Supabase';

export async function GET() {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    console.log(`Deleting notes trashed before ${twoWeeksAgo.toISOString()}`);
console.log('Date filter:', twoWeeksAgo.toISOString());

const testQuery = await supabase
    .from('notes')
    .select('count')
    .lte('created_at', twoWeeksAgo.toISOString())
    .eq('trashed', true);

console.log('Matching records count:', testQuery.data);
console.log('Query check:', testQuery.error ? 'Error: ' + testQuery.error.message : 'OK');
    
    const { data, error } = await supabase
        .from('notes')  // Use 'notes' as the table name
        .delete()
        .lte('created_at', twoWeeksAgo.toISOString())
        .eq('trashed', true)
        .select(); // Add this to get count of deleted items
    
    if (error) {
        console.error('Error deleting trash notes:', error);
        return json({ error: error.message }, { status: 500 });
    }
    
    console.log(`Successfully deleted ${data?.length ?? 0} trashed notes`);
    
    return json({ 
        message: 'Old trashed notes deleted', 
        count: data?.length ?? 0 
    }, { status: 200 });
}
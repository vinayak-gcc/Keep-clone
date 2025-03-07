import { supabase } from './Supabase';
import { notes } from '../../Store/store';


// Function to upload backup to Supabase Storage
interface Note {
	id: number;
	title: string;
	content: string;
	color: string;
	image?: string;
	pinned: boolean;
	user_email: string;
	trashed: boolean;
	archived: boolean;
	created_at: string;
}

async function backupNotesToSupabase(notesData: Note[], userEmail: string) {
    // Use email as the primary identifier for both filename and storage path
    const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${sanitizedEmail}_${Date.now()}.json`;
    const file = new File([JSON.stringify(notesData)], fileName, { type: 'application/json' });
    
    // Use sanitized email as the folder path
    const filePath = `${sanitizedEmail}/${fileName}`;
    
    // Check when the last backup was made
    const { data: existingBackups, error: listError } = await supabase.storage
        .from('NotesBackup')
        .list(sanitizedEmail);
    
    if (!listError && existingBackups && existingBackups.length > 0) {
        // Sort backups by created_at to find the most recent one
        const sortedBackups = existingBackups.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        const lastBackupTime = new Date(sortedBackups[0].created_at).getTime();
        const currentTime = Date.now();
        
        // Only backup if more than 24 hours have passed since last backup
        if (currentTime - lastBackupTime < 24 * 60 * 60 * 1000) {
            return { data: null, skipped: true };
        }
    }
    
    const { data, error } = await supabase.storage
        .from('NotesBackup')
        .upload(filePath, file, { upsert: true });
    
    if (error) {
        console.error('Error uploading backup:', error);
        return { error };
    } else {
        console.log('Backup saved successfully:', data);
        return { data };
    }
}

export async function loadNotes(userEmail: string) { 
    const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_email', userEmail)
        .eq('trashed', false)
        .eq('archived', false)
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error loading notes:', error);
        return;
    }

    // Process notes and update images efficiently
    const processedNotes = data.map(note => ({
        ...note,
        // image: note.image ? getCloudinaryUrl(note.image) : undefined
    }));

    // Save backup to Supabase Storage
    await backupNotesToSupabase(processedNotes, userEmail);

    notes.set(processedNotes);
}


export async function addNote(
	newTitle: string,
	newContent: string,
	newColor: string,
	selectedImage: File | string | null,
	userEmail: string,
	newPinned: boolean
) {
	// console.log('Adding new note:', {
	// 	newTitle,
	// 	newContent,
	// 	newColor,
	// 	selectedImage,
	// 	userEmail,
	// 	newPinned
	// });
	if (newTitle.trim() && newContent.trim()) {
		let imageUrl: string | null = null;
		try {
			if (selectedImage instanceof File) {
				const fileExt = selectedImage.name.split('.').pop();
				const fileName = `${Math.random()}.${fileExt}`;
				const { error } = await supabase.storage
					.from('note_images')
					.upload(fileName, selectedImage);
				if (error) throw error;
				const { data: urlData } = supabase.storage.from('note_images').getPublicUrl(fileName);
				imageUrl = urlData.publicUrl;
			} else if (typeof selectedImage === 'string') {
				imageUrl = selectedImage;
			}
			const { data, error } = await supabase
				.from('notes')
				.insert([
					{
						title: newTitle,
						content: newContent,
						color: newColor,
						image: imageUrl,
						pinned: newPinned,
						user_email: userEmail,
						trashed: false,
						archived: false
					}
				])
				.select();
			if (error) throw error;
			// console.log('Note added successfully:', data[0]);
			notes.update((current) => [...current, data[0]]);
		} catch (error) {
			console.error('Error adding note:', error);
			alert(`Error: ${(error as Error).message}`);
		}
	}
}

export async function updateNoteImage(id: number, file: File) {
	// console.log('Updating note image:', { id, file });

	try {
		const { data: authData } = await supabase.auth.getUser();
		const userEmail = authData?.user?.email;
		if (!userEmail) {
			throw new Error('User not authenticated');
		}
		// Step 1: Validate the file
		if (!file || !(file instanceof File)) {
			throw new Error('Invalid file provided');
		}

		console.log('File is valid:', { name: file.name, size: file.size });

		// Step 2: Upload the file to Supabase Storage
		const fileExt = file.name.split('.').pop();
		const fileName = `${Math.random()}.${fileExt}`;
		// console.log('Uploading file to storage:', { fileName });

		const { error: uploadError } = await supabase.storage
			.from('note_images')
			.upload(fileName, file);

		if (uploadError) {
			console.error('File upload failed:', uploadError);
			throw uploadError;
		}

		// console.log('File uploaded successfully:', { fileName });

		// Step 3: Get the public URL of the uploaded file
		const { data: urlData } = supabase.storage.from('note_images').getPublicUrl(fileName);

		const imageUrl = urlData.publicUrl;
		// console.log('Public URL retrieved:', { imageUrl });

		// Step 4: Update the database with the new image URL
		// console.log('Updating database with new image URL:', { id, imageUrl });

		const { error: updateError } = await supabase
			.from('notes')
			.update({ image: imageUrl }) // Update only the 'image' field
			.eq('id', id); // Ensure `id` matches the database type

		if (updateError) {
			console.error('Database update failed:', updateError);
			throw updateError;
		}

		// console.log('Database updated successfully');

		// Step 5: Update the local store
		notes.update((current) =>
			current.map((note) => (note.id === id ? { ...note, image: imageUrl } : note))
		);

		console.log('Local store updated successfully');
	} catch (error) {
		console.error('Error in updateNoteImage:', error);
		alert('Image update failed. Check the console for details.');
	}
}

export async function trashNote(id: number) {
	const { error } = await supabase
		.from('notes')
		.update({ trashed: true, updated_at: new Date().toISOString() }) // Add timestamp
		.eq('id', id);

	if (error) {
		console.error('Error trashing note:', error);
	} else {
		notes.update((current) => current.filter((n) => n.id !== id));
	}
}


export async function archiveNote(id: number ) {
	// console.log('Archiving note:', { id });
	const { error } = await supabase.from('notes').update({ archived: true }).eq('id', id);
	if (error) {
		console.error('Error archiving note:', error);
	} else {
		// console.log('Note archived successfully');
		notes.update((current) => current.filter((n) => n.id !== id));
	}
}

export async function updateNoteImageUrl(id: number, imageUrl: string) {
	// console.log('Updating note image URL:', { id, imageUrl, userEmail });

	try {
		const { data: authData } = await supabase.auth.getUser();
		const userEmail = authData?.user?.email;

		if (!userEmail) {
			throw new Error('User not authenticated');
		}

		// Update only the 'image' field, leaving the 'color' field unchanged
		const { error } = await supabase
			.from('notes')
			.update({ image: imageUrl }) // Only update the 'image' field
			.eq('id', id)
			.eq('user_email', userEmail);

		if (error) {
			console.error('Database update failed:', error);
			throw error;
		}

		// console.log('Database updated successfully');

		// Update the local store
		notes.update((current) =>
			current.map(
				(note) => (note.id === id ? { ...note, image: imageUrl } : note) // Only update the 'image' field
			)
		);

		// console.log('Local store updated successfully');
	} catch (error) {
		console.error('Error in updateNoteImageUrl:', error);
		alert('Failed to update note image URL. Check the console for details.');
	}
}

export async function updateNote(id: number, title: string, content: string) {
	// console.log('Updating note:', { id, title, content, userEmail });

	try {
		const { data: authData } = await supabase.auth.getUser();
		const userEmail = authData?.user?.email;
		if (!userEmail) {
			throw new Error('User not authenticated');
		}
		if (!title.trim() || !content.trim() || !userEmail) {
			throw new Error('Invalid input: title, content, or userEmail is missing');
		}

		// console.log('Inputs are valid:', { id, title, content, userEmail });

		const { error } = await supabase
			.from('notes')
			.update({ title, content })
			.eq('id', id)
			.eq('user_email', userEmail);

		if (error) {
			console.error('Database update failed:', error);
			throw error;
		}

		// console.log('Database updated successfully');

		notes.update((current) =>
			current.map((note) => (note.id === id ? { ...note, title, content } : note))
		);

		// console.log('Local store updated successfully');
	} catch (error) {
		console.error('Error in updateNote:', error);
		alert('Failed to update note. Check the console for details.');
	}
}
export async function deleteNote(id: number, userEmail: string) {
	// console.log('Deleting note:', { id, userEmail });
	const { error } = await supabase.from('notes').delete().eq('id', id).eq('user_email', userEmail);
	if (error) {
		console.error('Error deleting note:', error);
	} else {
		// console.log('Note deleted successfully');
		notes.update((current) => current.filter((n) => n.id !== id));
	}
}

export async function changeNoteColor(id: string, color: string) {
	// console.log('Changing note color:', { id, color });

	try {
		const { data: authData } = await supabase.auth.getUser();
		const userEmail = authData?.user?.email;

		if (!userEmail) {
			throw new Error('User not authenticated');
		}

		// console.log('Authenticated user email:', userEmail);

		// Update the 'color' field and reset the 'image' field in the database
		const { error } = await supabase
			.from('notes')
			.update({ color, image: null }) // Reset 'image' when changing color
			.eq('id', id)
			.eq('user_email', userEmail);

		if (error) {
			console.error('Error changing note color:', error);
			throw error;
		}

		// console.log('Database updated successfully');

		// Update the local store
		notes.update((current) =>
			current.map(
				(note) => (note.id === Number(id) ? { ...note, color, image: null } : note) // Reset 'image'
			)
		);

		// console.log('Local store updated successfully');
	} catch (error) {
		console.error('Error in changeNoteColor:', error);
		alert(`Failed to change note color: ${(error as Error).message}`);
	}
}

export async function togglePin(id: string, pinned: boolean) {
	// console.log('Toggling pin status:', { id, pinned });
	try {
		const { data: authData } = await supabase.auth.getUser();
		const userEmail = authData?.user?.email;
		if (!userEmail) {
			throw new Error('User not authenticated');
		}
		// console.log('Authenticated user email:', userEmail);
		const { error } = await supabase
			.from('notes')
			.update({ pinned: !pinned })
			.eq('id', id)
			.eq('user_email', userEmail);
		if (error) {
			console.error('Error toggling pin status:', error);
			throw error;
		}
		// console.log('Pin status toggled successfully');
		notes.update((current) =>
			current.map((note) => (note.id === Number(id) ? { ...note, pinned: !pinned } : note))
		);
	} catch (error) {
		console.error('Error in togglePin:', error);
		throw error;
	}
}

export async function downloadNotesBackup(userEmail: string) {
    try {
        // Get the current authenticated user
        const { data: user, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
            console.error('Error getting user:', authError);
            return { error: 'Error getting user' };
        }
        
        if (!user) {
            console.error('User not authenticated');
            return { error: 'User not authenticated' };
        }
        
        const userId = user.user.id;
        
        // List available backups for this user
        const { data: backups, error: listError } = await supabase.storage
            .from('NotesBackup')
            .list(userId);
            
        if (listError) {
            console.error('Error listing backups:', listError);
            return { error: 'Could not list available backups' };
        }
        
        if (!backups || backups.length === 0) {
            return { error: 'No backups found for this user' };
        }
        
        // Sort backups to get the most recent one
        const sortedBackups = backups.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        const latestBackup = sortedBackups[0];
        const filePath = `${userId}/${latestBackup.name}`;
        
        // Get a signed URL for downloading
		const { data, error: urlError } = await supabase.storage
			.from('NotesBackup')
			.createSignedUrl(filePath, 300); // URL valid for 5 minutes
			
		if (urlError) {
			console.error('Error creating download URL:', urlError);
			return { error: 'Could not generate download link' };
		}
		
		if (!data || !data.signedUrl) {
			return { error: 'Failed to generate download URL' };
		}
		
		// Fetch the actual backup data
		const response = await fetch(data.signedUrl);
        if (!response.ok) {
            return { error: `Failed to fetch backup: ${response.statusText}` };
        }
        
        const backupData = await response.json();
        
        // Create and trigger download of the JSON file
        const dataStr = JSON.stringify(backupData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const downloadUrl = URL.createObjectURL(dataBlob);
        
        const downloadLink = document.createElement('a');
        downloadLink.href = downloadUrl;
        downloadLink.download = `notes_backup_${userEmail}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        // Clean up the object URL
        setTimeout(() => {
            URL.revokeObjectURL(downloadUrl);
        }, 100);
        
        return { success: true, fileName: downloadLink.download };
        
    } catch (error) {
        console.error('Download backup error:', error);
        return { error: 'An unexpected error occurred during download' };
    }
}
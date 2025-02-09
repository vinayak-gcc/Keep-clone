import { supabase } from './Supabase';
import { notes } from '../../Store/store';

export async function loadNotes(userEmail: string) {
	console.log('Loading notes for user:', userEmail);
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
	} else {
		console.log('Notes loaded successfully:', data);
		notes.set(data);
	}
}

export async function addNote(
	newTitle: string,
	newContent: string,
	newColor: string,
	selectedImage: File | string | null,
	userEmail: string,
	newPinned: boolean
) {
	console.log('Adding new note:', {
		newTitle,
		newContent,
		newColor,
		selectedImage,
		userEmail,
		newPinned
	});
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
			console.log('Note added successfully:', data[0]);
			notes.update((current) => [...current, data[0]]);
		} catch (error) {
			console.error('Error adding note:', error);
			alert(`Error: ${(error as Error).message}`);
		}
	}
}

export async function updateNoteImage(id: number, file: File) {
	console.log('Updating note image:', { id, file });

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
		console.log('Uploading file to storage:', { fileName });

		const { error: uploadError } = await supabase.storage
			.from('note_images')
			.upload(fileName, file);

		if (uploadError) {
			console.error('File upload failed:', uploadError);
			throw uploadError;
		}

		console.log('File uploaded successfully:', { fileName });

		// Step 3: Get the public URL of the uploaded file
		const { data: urlData } = supabase.storage.from('note_images').getPublicUrl(fileName);

		const imageUrl = urlData.publicUrl;
		console.log('Public URL retrieved:', { imageUrl });

		// Step 4: Update the database with the new image URL
		console.log('Updating database with new image URL:', { id, imageUrl });

		const { error: updateError } = await supabase
			.from('notes')
			.update({ image: imageUrl }) // Update only the 'image' field
			.eq('id', id); // Ensure `id` matches the database type

		if (updateError) {
			console.error('Database update failed:', updateError);
			throw updateError;
		}

		console.log('Database updated successfully');

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
	console.log('Trashing note:', { id });
	const { error } = await supabase.from('notes').update({ trashed: true }).eq('id', id);
	if (error) {
		console.error('Error trashing note:', error);
	} else {
		console.log('Note trashed successfully');
		notes.update((current) => current.filter((n) => n.id !== id));
	}
}

export async function archiveNote(id: number) {
	console.log('Archiving note:', { id });
	const { error } = await supabase.from('notes').update({ archived: true }).eq('id', id);
	if (error) {
		console.error('Error archiving note:', error);
	} else {
		console.log('Note archived successfully');
		notes.update((current) => current.filter((n) => n.id !== id));
	}
}

export async function updateNoteImageUrl(id: number, imageUrl: string, userEmail: string) {
	console.log('Updating note image URL:', { id, imageUrl, userEmail });

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

		console.log('Database updated successfully');

		// Update the local store
		notes.update((current) =>
			current.map(
				(note) => (note.id === id ? { ...note, image: imageUrl } : note) // Only update the 'image' field
			)
		);

		console.log('Local store updated successfully');
	} catch (error) {
		console.error('Error in updateNoteImageUrl:', error);
		alert('Failed to update note image URL. Check the console for details.');
	}
}

export async function updateNote(id: number, title: string, content: string, userEmail: string) {
	console.log('Updating note:', { id, title, content, userEmail });

	try {
		const { data: authData } = await supabase.auth.getUser();
		const userEmail = authData?.user?.email;
		if (!userEmail) {
			throw new Error('User not authenticated');
		}
		if (!title.trim() || !content.trim() || !userEmail) {
			throw new Error('Invalid input: title, content, or userEmail is missing');
		}

		console.log('Inputs are valid:', { id, title, content, userEmail });

		const { error } = await supabase
			.from('notes')
			.update({ title, content })
			.eq('id', id)
			.eq('user_email', userEmail);

		if (error) {
			console.error('Database update failed:', error);
			throw error;
		}

		console.log('Database updated successfully');

		notes.update((current) =>
			current.map((note) => (note.id === id ? { ...note, title, content } : note))
		);

		console.log('Local store updated successfully');
	} catch (error) {
		console.error('Error in updateNote:', error);
		alert('Failed to update note. Check the console for details.');
	}
}
export async function deleteNote(id: number, userEmail: string) {
	console.log('Deleting note:', { id, userEmail });
	const { error } = await supabase.from('notes').delete().eq('id', id).eq('user_email', userEmail);
	if (error) {
		console.error('Error deleting note:', error);
	} else {
		console.log('Note deleted successfully');
		notes.update((current) => current.filter((n) => n.id !== id));
	}
}

export async function changeNoteColor(id: string, color: string) {
	console.log('Changing note color:', { id, color });

	try {
		const { data: authData } = await supabase.auth.getUser();
		const userEmail = authData?.user?.email;

		if (!userEmail) {
			throw new Error('User not authenticated');
		}

		console.log('Authenticated user email:', userEmail);

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

		console.log('Database updated successfully');

		// Update the local store
		notes.update((current) =>
			current.map(
				(note) => (note.id === Number(id) ? { ...note, color, image: null } : note) // Reset 'image'
			)
		);

		console.log('Local store updated successfully');
	} catch (error) {
		console.error('Error in changeNoteColor:', error);
		alert(`Failed to change note color: ${(error as Error).message}`);
	}
}

export async function togglePin(id: string, pinned: boolean) {
	console.log('Toggling pin status:', { id, pinned });
	try {
		const { data: authData } = await supabase.auth.getUser();
		const userEmail = authData?.user?.email;
		if (!userEmail) {
			throw new Error('User not authenticated');
		}
		console.log('Authenticated user email:', userEmail);
		const { error } = await supabase
			.from('notes')
			.update({ pinned: !pinned })
			.eq('id', id)
			.eq('user_email', userEmail);
		if (error) {
			console.error('Error toggling pin status:', error);
			throw error;
		}
		console.log('Pin status toggled successfully');
		notes.update((current) =>
			current.map((note) => (note.id === Number(id) ? { ...note, pinned: !pinned } : note))
		);
	} catch (error) {
		console.error('Error in togglePin:', error);
		throw error;
	}
}

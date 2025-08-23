import { supabase } from './supabase';

export interface UploadResult {
  path: string;
  publicUrl: string;
}

export const uploadAvatar = async (file: File, userId: string): Promise<UploadResult> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/avatar.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, {
      upsert: true,
      contentType: file.type
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName);

  return publicUrl;
};

export const uploadBattleExport = async (
  content: string, 
  fileName: string, 
  userId: string,
  contentType: string = 'application/json'
): Promise<UploadResult> => {
  const filePath = `${userId}/${fileName}`;
  const file = new Blob([content], { type: contentType });

  const { data, error } = await supabase.storage
    .from('battle-exports')
    .upload(filePath, file, {
      upsert: true,
      contentType
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('battle-exports')
    .getPublicUrl(filePath);

  return {
    path: data.path,
    publicUrl
  };
};

export const deleteAvatar = async (userId: string): Promise<void> => {
  const { error } = await supabase.storage
    .from('avatars')
    .remove([`${userId}/avatar.jpg`, `${userId}/avatar.png`, `${userId}/avatar.webp`]);

  if (error) throw error;
};

export const deleteBattleExport = async (filePath: string): Promise<void> => {
  const { error } = await supabase.storage
    .from('battle-exports')
    .remove([filePath]);

  if (error) throw error;
};
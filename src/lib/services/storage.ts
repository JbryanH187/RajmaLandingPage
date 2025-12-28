import { supabase } from "@/lib/supabase"
import { v4 as uuidv4 } from 'uuid'

const BUCKET_NAME = 'menu-images'

export type UploadResult = {
    path: string
    url: string
}

export const storageService = {
    /**
     * Uploads an image to the menu-images bucket
     * @param file The file object to upload
     * @param folder Optional folder path (e.g. 'products', 'categories')
     */
    async uploadImage(file: File, folder: string = 'products'): Promise<UploadResult> {
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${uuidv4()}.${fileExt}`
            const filePath = `${folder}/${fileName}`

            const { error: uploadError, data } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                })

            if (uploadError) {
                throw uploadError
            }

            const { data: { publicUrl } } = supabase.storage
                .from(BUCKET_NAME)
                .getPublicUrl(filePath)

            return {
                path: filePath,
                url: publicUrl
            }
        } catch (error) {
            console.error('Error uploading image:', error)
            throw error
        }
    },

    /**
     * Get the public URL for an image path
     */
    getPublicUrl(path: string): string {
        const { data: { publicUrl } } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(path)

        return publicUrl
    },

    /**
     * Delete an image from storage
     */
    async deleteImage(path: string): Promise<void> {
        try {
            const { error } = await supabase.storage
                .from(BUCKET_NAME)
                .remove([path])

            if (error) {
                throw error
            }
        } catch (error) {
            console.error('Error deleting image:', error)
            throw error
        }
    }
}

import { useState, useEffect, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { BodyMetric } from '../types';

export const useBodyMetrics = () => {
    const { user } = useAuth();
    const [metrics, setMetrics] = useState<BodyMetric[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMetrics = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        const { data, error: err } = await supabase
            .from('body_metrics')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false });
        if (err) setError(err.message);
        else setMetrics(data || []);
        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchMetrics();
    }, [fetchMetrics]);

    const logMetric = async (weight: number | null, waist: number | null, photoUri: string | null) => {
        if (!user) return { error: 'Not authenticated' };

        let photoUrl: string | null = null;

        if (photoUri) {
            const fileName = `${user.id}/${Date.now()}.jpg`;
            const response = await fetch(photoUri);
            const blob = await response.blob();
            const arrayBuffer = await new Response(blob).arrayBuffer();

            const { error: uploadErr } = await supabase.storage
                .from('progress-photos')
                .upload(fileName, arrayBuffer, {
                    contentType: 'image/jpeg',
                    upsert: false,
                });

            if (uploadErr) return { error: uploadErr.message };

            const { data: urlData } = supabase.storage
                .from('progress-photos')
                .getPublicUrl(fileName);

            photoUrl = urlData.publicUrl;
        }

        const { data, error: err } = await supabase
            .from('body_metrics')
            .insert({
                user_id: user.id,
                weight,
                waist,
                photo_url: photoUrl,
            })
            .select()
            .single();

        if (err) return { error: err.message };
        setMetrics(prev => [data, ...prev]);
        return { error: null, data };
    };

    const pickImage = async (): Promise<string | null> => {
        const permResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permResult.granted) return null;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.7,
            allowsEditing: true,
            aspect: [3, 4],
        });

        if (result.canceled) return null;
        return result.assets[0].uri;
    };

    return { metrics, loading, error, fetchMetrics, logMetric, pickImage };
};

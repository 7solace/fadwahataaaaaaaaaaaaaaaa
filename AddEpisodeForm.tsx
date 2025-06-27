import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addEpisodeToSeason } from '../services/episodeService';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface AddEpisodeFormProps {
  seasonId: number;
  animeId: string;
  onEpisodeAdded: () => void;
}

const AddEpisodeForm = ({ seasonId, onEpisodeAdded }: AddEpisodeFormProps) => {
    const [episodeNumber, setEpisodeNumber] = useState(1);
    const [title, setTitle] = useState('');
    const [videoUrl, setVideoUrl] = useState('');

    const addEpisodeMutation = useMutation({
        mutationFn: addEpisodeToSeason,
        onSuccess: () => {
            alert('Bölüm başarıyla eklendi!');
            onEpisodeAdded();
            setEpisodeNumber(prev => prev + 1);
            setTitle('');
            setVideoUrl('');
        },
        onError: (error: Error) => alert(`Bölüm eklenirken hata: ${error.message}`),
    });

    const handleEpisodeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addEpisodeMutation.mutate({ seasonId, episodeNumber, title, videoUrl });
    };

    return (
        <form onSubmit={handleEpisodeSubmit} className="space-y-3 mt-4 p-4 bg-gray-100 rounded-lg border">
            <h4 className="font-semibold text-gray-700">Bu Sezona Yeni Bölüm Ekle</h4>
            <div className="flex flex-col sm:flex-row gap-4">
                <div>
                    <Label htmlFor="epNum">Bölüm No.</Label>
                    <Input id="epNum" type="number" placeholder="1" value={episodeNumber} onChange={e => setEpisodeNumber(Number(e.target.value))} required />
                </div>
                <div className="flex-grow">
                    <Label htmlFor="epTitle">Bölüm Başlığı (Opsiyonel)</Label>
                    <Input id="epTitle" type="text" placeholder="Bölüm Adı" value={title} onChange={e => setTitle(e.target.value)} />
                </div>
            </div>
            <div>
                <Label htmlFor="epUrl">Video Embed Linki</Label>
                <Input id="epUrl" type="text" placeholder="https://..." value={videoUrl} onChange={e => setVideoUrl(e.target.value)} required />
            </div>
            <Button type="submit" disabled={addEpisodeMutation.isPending}>
                {addEpisodeMutation.isPending ? 'Ekleniyor...' : 'Bölüm Ekle'}
            </Button>
        </form>
    );
}
export default AddEpisodeForm;
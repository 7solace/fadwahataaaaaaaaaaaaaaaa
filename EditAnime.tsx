import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAnimeById, updateAnimeDetails, addSeasonToAnime } from '../services/animeService';
import { deleteEpisode, updateEpisode } from '../services/episodeService';
import AddEpisodeForm from '../components/AddEpisodeForm';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getDisplayTitle } from '../lib/utils';

// BÖLÜM DÜZENLEME PENCERESİ
const EditEpisodeDialog = ({ episode, animeId, onUpdate }: { episode: any, animeId: string, onUpdate: () => void }) => {
  const [title, setTitle] = useState(episode.title || '');
  const [videoUrl, setVideoUrl] = useState(episode.videoUrl || '');
  const [isOpen, setIsOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: updateEpisode,
    onSuccess: () => {
      alert("Bölüm güncellendi!");
      onUpdate();
      setIsOpen(false);
    },
    onError: (error: Error) => alert(`Hata: ${error.message}`)
  });

  const handleSubmit = () => {
    mutation.mutate({ episodeId: episode.id, data: { title, videoUrl } });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Düzenle</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bölüm {episode.episodeNumber} Düzenle</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div><Label htmlFor="epTitle">Bölüm Başlığı</Label><Input id="epTitle" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div><Label htmlFor="epUrl">Video Linki</Label><Input id="epUrl" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} /></div>
          <Button onClick={handleSubmit} disabled={mutation.isPending}>{mutation.isPending ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ANA DÜZENLEME SAYFASI
const EditAnime = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [seasonNumber, setSeasonNumber] = useState(1);
  const [seasonTitle, setSeasonTitle] = useState('');

  const { data: anime, isLoading } = useQuery<any>({
    queryKey: ['anime', id],
    queryFn: () => getAnimeById(id),
    enabled: !!id,
  });
  
  useEffect(() => {
    if (anime?.seasons?.length > 0) {
      setSeasonNumber(anime.seasons.length + 1);
    }
  }, [anime]);

  const addSeasonMutation = useMutation({
    mutationFn: addSeasonToAnime,
    onSuccess: () => {
      alert(`Sezon eklendi!`);
      queryClient.invalidateQueries({ queryKey: ['anime', id] });
      setSeasonNumber(prev => prev + 1);
      setSeasonTitle('');
    },
    onError: (error: Error) => alert(`Sezon eklenirken hata: ${error.message}`),
  });

  const deleteEpisodeMutation = useMutation({
    mutationFn: deleteEpisode,
    onSuccess: () => {
      alert("Bölüm başarıyla silindi.");
      queryClient.invalidateQueries({ queryKey: ['anime', id] });
    },
    onError: (error: Error) => alert(`Bölüm silinirken hata: ${error.message}`),
  });

  const handleSeasonSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!id) return; addSeasonMutation.mutate({ animeId: id, seasonNumber, title: seasonTitle }); };
  const handleDeleteEpisode = (episodeId: number) => { if (window.confirm("Bu bölümü kalıcı olarak silmek istediğinizden emin misiniz?")) { deleteEpisodeMutation.mutate(episodeId); } };

  if (isLoading) return <div>Yükleniyor...</div>;
  if (!anime) return <div>Anime bulunamadı.</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">"{getDisplayTitle(anime)}" Düzenle & Yönet</h1>
      {/* Genel Bilgiler Formunu şimdilik kapattım, sonra geri ekleriz */}
      <div className="mt-10 p-6 border rounded-lg bg-gray-50 shadow">
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Sezonlar ve Bölümler</h2>
        <Accordion type="single" collapsible className="w-full mb-6">
          {anime.seasons?.length > 0 ? anime.seasons.map((season: any) => (
            <AccordionItem value={`season-${season.id}`} key={season.id}>
              <AccordionTrigger className="text-lg font-medium hover:no-underline">Sezon {season.seasonNumber}: {season.title || ''}</AccordionTrigger>
              <AccordionContent>
                <h4 className="font-semibold mb-2">Mevcut Bölümler:</h4>
                <ul className="pl-4 space-y-2 mb-4">
                  {season.episodes?.length > 0 ? season.episodes.map((ep: any) => (
                    <li key={ep.id} className="flex justify-between items-center p-2 hover:bg-gray-100 rounded-md">
                      <span className="truncate pr-4">Bölüm {ep.episodeNumber}: {ep.title || 'İsimsiz'}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <EditEpisodeDialog episode={ep} animeId={id!} onUpdate={() => queryClient.invalidateQueries({ queryKey: ['anime', id] })} />
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteEpisode(ep.id)} disabled={deleteEpisodeMutation.isPending}>Sil</Button>
                      </div>
                    </li>
                  )) : <li>Bu sezona henüz bölüm eklenmemiş.</li>}
                </ul>
                <AddEpisodeForm seasonId={season.id} animeId={id!} onEpisodeAdded={() => queryClient.invalidateQueries({ queryKey: ['anime', id] })} />
              </AccordionContent>
            </AccordionItem>
          )) : <p className="text-gray-500">Bu anime için henüz sezon eklenmemiş.</p>}
        </Accordion>
        <form onSubmit={handleSeasonSubmit} className="space-y-4 pt-6 border-t">
          <h3 className="text-xl font-semibold">Animeye Yeni Sezon Ekle</h3>
          <div className="flex gap-4">
            <Input type="number" placeholder="Sezon No." value={seasonNumber} onChange={e => setSeasonNumber(Number(e.target.value))} className="w-1/4" required/>
            <Input type="text" placeholder="Sezon Başlığı (Opsiyonel)" value={seasonTitle} onChange={e => setSeasonTitle(e.target.value)} className="w-3/4"/>
          </div>
          <Button type="submit" disabled={addSeasonMutation.isPending}>{addSeasonMutation.isPending ? 'Ekleniyor...' : 'Sezon Ekle'}</Button>
        </form>
      </div>
    </div>
  );
};
export default EditAnime;
import { useEffect, useRef, useState } from 'react';
import Button from '../components/Button';
import Field from '../components/Field';
import { Notice } from '../components/States';
import { IconTrash, IconUpload } from '../components/Icons';
import { api } from '../lib/api';

const MAX_BYTES = 5 * 1024 * 1024;
const OK_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function ExistingImage({ vehicleId, image, onUpdated, onRemoved }) {
  const [alt, setAlt] = useState(image.altText);
  const [st, setSt] = useState({ busy: '', error: '' });
  const run = async (kind, fn) => {
    setSt({ busy: kind, error: '' });
    try { await fn(); setSt({ busy: '', error: '' }); } catch (e) { setSt({ busy: '', error: e.message }); }
  };
  return (
    <li className="flex gap-4 rounded-2xl bg-white p-3 shadow-sm">
      <img src={image.url} alt={image.altText} className="h-24 w-28 shrink-0 rounded-xl object-cover" />
      <div className="min-w-0 flex-1 space-y-2">
        <Field id={`alt-${image.id}`} label="Description / alt text" required value={alt} onChange={(e) => setAlt(e.target.value)} maxLength={200} />
        {st.error && <p role="alert" className="text-sm font-medium text-red-800">⚠ {st.error}</p>}
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" loading={st.busy === 'save'} disabled={alt.trim() === image.altText || alt.trim().length < 3} onClick={() => run('save', async () => onUpdated(await api.admin.updateImage(vehicleId, image.id, { altText: alt })))}>Save text</Button>
          {image.isPrimary ? <span className="rounded-full bg-sage-200 px-3 py-1 text-xs font-bold text-forest">Main photo</span> : <Button size="sm" variant="ghost" loading={st.busy === 'primary'} onClick={() => run('primary', async () => { await api.admin.updateImage(vehicleId, image.id, { isPrimary: true }); onUpdated({ ...image, isPrimary: true }); })}>Make main photo</Button>}
          <Button size="sm" variant="ghost" className="!text-red-800 hover:!bg-red-50" loading={st.busy === 'del'} aria-label={`Delete photo: ${image.altText}`} onClick={() => run('del', async () => { await api.admin.deleteImage(vehicleId, image.id); onRemoved(image.id); })}><IconTrash size={18} />Delete</Button>
        </div>
      </div>
    </li>
  );
}

/** Upload several photos at once; each needs its own alt text before it can be sent. */
export default function ImageManager({ vehicle, onImages }) {
  const input = useRef(null);
  const [queue, setQueue] = useState([]); // {file, alt, preview, error}
  const [st, setSt] = useState({ busy: false, error: '' });
  const images = vehicle.images || [];

  useEffect(() => () => queue.forEach((q) => URL.revokeObjectURL(q.preview)), []); // eslint-disable-line

  function pick(e) {
    const added = [...e.target.files].map((file) => ({
      file, alt: '', preview: URL.createObjectURL(file),
      error: !OK_TYPES.includes(file.type) ? 'Only JPEG, PNG or WebP images.' : file.size > MAX_BYTES ? 'Larger than 5 MB.' : '',
    }));
    setQueue((q) => [...q, ...added].slice(0, 10));
    e.target.value = '';
  }
  const setAlt = (i, alt) => setQueue((q) => q.map((x, j) => (j === i ? { ...x, alt } : x)));
  const drop = (i) => setQueue((q) => { URL.revokeObjectURL(q[i].preview); return q.filter((_, j) => j !== i); });
  const valid = queue.length > 0 && queue.every((q) => !q.error && q.alt.trim().length >= 3);

  async function upload() {
    setSt({ busy: true, error: '' });
    try {
      const created = await api.admin.uploadImages(vehicle._id, queue.map((q) => q.file), queue.map((q) => q.alt.trim()));
      queue.forEach((q) => URL.revokeObjectURL(q.preview));
      setQueue([]);
      onImages([...images, ...created]);
      setSt({ busy: false, error: '' });
    } catch (e) {
      setSt({ busy: false, error: e.message });
    }
  }

  return (
    <div className="space-y-6">
      {images.length === 0 ? <Notice>No photos yet. Until you upload one, visitors see an illustrated placeholder.</Notice> : (
        <ul className="space-y-3">
          {images.map((im) => (
            <ExistingImage key={im.id} vehicleId={vehicle._id} image={im}
              onUpdated={(u) => onImages(images.map((x) => (x.id === u.id ? { ...x, ...u } : u.isPrimary ? { ...x, isPrimary: false } : x)))}
              onRemoved={(id) => { const rest = images.filter((x) => x.id !== id); if (rest.length && !rest.some((x) => x.isPrimary)) rest[0] = { ...rest[0], isPrimary: true }; onImages(rest); }} />
          ))}
        </ul>
      )}

      <div className="rounded-2xl border-2 border-dashed border-forest/30 bg-white/70 p-5">
        <h3 className="text-lg font-bold">Add photos</h3>
        <p className="mt-1 text-sm text-charcoal/80">JPEG, PNG or WebP, up to 5 MB each, 10 at a time. Describe what each photo shows - this is read aloud by screen readers.</p>
        <input ref={input} id={`files-${vehicle._id}`} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={pick} className="sr-only" aria-label="Choose vehicle photos" />
        <Button variant="outline" size="sm" className="mt-3" onClick={() => input.current.click()}><IconUpload size={18} />Choose photos</Button>
        {queue.length > 0 && (
          <ul className="mt-5 space-y-3">
            {queue.map((q, i) => (
              <li key={q.preview} className="flex gap-3 rounded-xl bg-ivory p-3">
                <img src={q.preview} alt="" className="h-20 w-24 shrink-0 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{q.file.name} <span className="font-normal text-charcoal/60">({(q.file.size / 1024 / 1024).toFixed(1)} MB)</span></p>
                  {q.error ? <p role="alert" className="text-sm font-medium text-red-800">⚠ {q.error}</p> : (
                    <Field id={`new-alt-${i}`} label="Description / alt text" required placeholder="e.g. Front view of the SUV beside a lake" value={q.alt} onChange={(e) => setAlt(i, e.target.value)} maxLength={200} className="mt-1" />
                  )}
                </div>
                <button type="button" onClick={() => drop(i)} aria-label={`Remove ${q.file.name} from upload`} className="self-start rounded-full p-2 text-forest hover:bg-forest/10"><IconTrash size={18} /></button>
              </li>
            ))}
          </ul>
        )}
        {st.error && <Notice tone="error" className="mt-4">{st.error}</Notice>}
        {queue.length > 0 && <Button variant="dark" className="mt-4" loading={st.busy} disabled={!valid} onClick={upload}>Upload {queue.length} photo{queue.length > 1 ? 's' : ''}</Button>}
      </div>
    </div>
  );
}

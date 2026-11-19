import { useState } from 'react';
import PageHero from '../components/PageHero';
import Field from '../components/Field';
import Button from '../components/Button';
import { Notice } from '../components/States';
import { IconClock, IconMail, IconPhone, IconPin } from '../components/Icons';
import { api } from '../lib/api';
import { validateContact } from '../lib/validation';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { SITE } from '../lib/site';

const EMPTY = { name: '', email: '', message: '' };

export default function Contact() {
  useDocumentTitle('Contact');
  const [v, setV] = useState(EMPTY);
  const [touched, setTouched] = useState({});
  const [serverErr, setServerErr] = useState({});
  const [state, setState] = useState({ status: 'idle', message: '' });
  const errors = { ...validateContact(v), ...serverErr };
  const show = (k) => (touched[k] || touched.all) && errors[k];
  const set = (k) => (e) => { setV((p) => ({ ...p, [k]: e.target.value })); setServerErr((p) => ({ ...p, [k]: undefined })); };
  const blur = (k) => () => setTouched((t) => ({ ...t, [k]: true }));

  async function submit(e) {
    e.preventDefault();
    setTouched({ all: true });
    if (Object.values(validateContact(v)).some(Boolean)) return;
    setState({ status: 'sending', message: '' });
    try {
      const r = await api.contact(v);
      setState({ status: 'done', message: r.message });
      setV(EMPTY); setTouched({});
    } catch (err) {
      setServerErr(err.fieldErrors || {});
      setState({ status: 'error', message: err.message });
    }
  }

  const items = [
    { i: IconPhone, l: 'Phone', t: SITE.phone }, { i: IconMail, l: 'Email', t: SITE.email },
    { i: IconPin, l: 'Service area', t: SITE.serviceArea }, { i: IconClock, l: 'Hours', t: SITE.hours },
  ];
  return (
    <>
      <PageHero eyebrow="Contact" title="Let’s talk about your trip.">Questions about a route, a vehicle or a group booking? Send us a message. Details below are placeholders.</PageHero>
      <section className="container-x grid gap-12 pb-24 lg:grid-cols-12">
        <ul className="space-y-6 lg:col-span-5">
          {items.map(({ i: Icon, l, t }) => (
            <li key={l} className="flex gap-4">
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-forest text-sun"><Icon /></span>
              <div><p className="eyebrow">{l}</p><p className="mt-1 text-lg font-medium">{t}</p></div>
            </li>
          ))}
        </ul>
        <form onSubmit={submit} noValidate className="card space-y-5 p-6 sm:p-8 lg:col-span-7" aria-label="Contact form">
          <Field id="c-name" label="Your name" required autoComplete="name" value={v.name} onChange={set('name')} onBlur={blur('name')} error={show('name')} />
          <Field id="c-email" label="Email" type="email" required autoComplete="email" value={v.email} onChange={set('email')} onBlur={blur('email')} error={show('email')} />
          <Field id="c-msg" as="textarea" rows={6} label="Message" required value={v.message} onChange={set('message')} onBlur={blur('message')} error={show('message')} />
          {state.status === 'done' && <Notice tone="success" title="Message sent">{state.message}</Notice>}
          {state.status === 'error' && <Notice tone="error" title="We couldn’t send that">{state.message}</Notice>}
          <Button type="submit" variant="dark" size="lg" loading={state.status === 'sending'}>Send message</Button>
        </form>
      </section>
    </>
  );
}

import { MapPin, MessageCircle, Navigation, Phone, Store } from "lucide-react";
import {
  getLocalStores,
  getStoreDirectionsUrl,
  getStoreMapEmbedUrl,
} from "@/lib/localStores";
import { getWhatsAppLink } from "@/utils/whatsappLink";

/**
 * "Our Store" — the franchise partner(s) a customer can visit in this city,
 * with a map. Cities with no partner render nothing, so this is safe to drop
 * into any city page. Content comes from /admin/local-stores.
 */
export default async function OurStoreSection({ city, cityName }) {
  const stores = await getLocalStores(city || cityName);
  if (!stores.length) return null;

  const label = cityName || stores[0].cityName || city || "";

  return (
    <section
      id="our-store"
      className="relative py-16 sm:py-20 px-6 overflow-hidden bg-white"
    >
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Heading */}
        <div className="text-center mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-black text-lemon-glow text-[10px] sm:text-xs font-black uppercase tracking-[0.28em]">
            <Store size={13} />
            Our Store
          </div>

          <h2 className="font-black uppercase tracking-tight leading-[1.1] text-black text-2xl sm:text-3xl lg:text-4xl">
            Visit Us {label ? `In ${label}` : ""}
          </h2>

          <p className="mt-3 text-sm sm:text-base text-slate-600 font-medium max-w-xl mx-auto">
            Our {label ? `${label} ` : ""}franchise partner — walk in or message
            us on WhatsApp for Google Business Profile help.
          </p>
        </div>

        <div className="space-y-8">
          {stores.map((store) => {
            const mapUrl = getStoreMapEmbedUrl(store);
            const directionsUrl = getStoreDirectionsUrl(store);
            const waLink = store.whatsapp
              ? getWhatsAppLink(store.whatsapp, {
                  text: `Hi ${store.name}, I found you on Limbu AI${
                    label ? ` (${label})` : ""
                  } and would like to know more.`,
                })
              : "";

            return (
              <div
                key={String(store._id || store.name)}
                className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm hover:shadow-xl transition-shadow duration-500"
              >
                <div className="grid lg:grid-cols-2">
                  {/* Details */}
                  <div className="p-7 sm:p-10 flex flex-col justify-center">
                    <h3 className="text-xl sm:text-2xl font-black text-black">
                      {store.name}
                    </h3>

                    <div className="mt-6 flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                        <MapPin size={16} />
                      </span>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                          Address
                        </p>
                        <p className="mt-1 text-sm sm:text-base font-semibold text-slate-800 leading-relaxed">
                          {store.address}
                        </p>
                      </div>
                    </div>

                    {store.whatsapp && (
                      <div className="mt-5 flex items-start gap-3">
                        <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                          <MessageCircle size={16} />
                        </span>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                            WhatsApp
                          </p>
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 block text-sm sm:text-base font-bold text-slate-900 hover:text-emerald-600 transition"
                          >
                            {store.whatsapp}
                          </a>
                        </div>
                      </div>
                    )}

                    {store.phone && (
                      <div className="mt-5 flex items-start gap-3">
                        <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <Phone size={16} />
                        </span>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                            Call
                          </p>
                          <a
                            href={`tel:${store.phone.replace(/\s+/g, "")}`}
                            className="mt-1 block text-sm sm:text-base font-bold text-slate-900 hover:text-blue-600 transition"
                          >
                            {store.phone}
                          </a>
                        </div>
                      </div>
                    )}

                    <div className="mt-8 flex flex-col sm:flex-row gap-3">
                      {store.whatsapp && (
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-black text-white transition hover:bg-emerald-600"
                        >
                          <MessageCircle size={16} />
                          Chat on WhatsApp
                        </a>
                      )}

                      <a
                        href={directionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-slate-200 px-6 py-3 text-sm font-black text-slate-800 transition hover:border-slate-900"
                      >
                        <Navigation size={16} />
                        Get Directions
                      </a>
                    </div>
                  </div>

                  {/* Map */}
                  <div className="min-h-[280px] lg:min-h-[380px] border-t lg:border-t-0 lg:border-l border-slate-200">
                    <iframe
                      src={mapUrl}
                      title={`${store.name} location map`}
                      className="h-full w-full min-h-[280px] lg:min-h-[380px]"
                      style={{ border: 0 }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      allowFullScreen
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

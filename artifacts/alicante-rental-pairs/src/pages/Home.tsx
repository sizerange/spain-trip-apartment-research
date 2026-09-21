import { useMemo, useState } from 'react';
import { useGetApartmentPairs, type ApartmentPair, type ApartmentPairListing, type GetApartmentPairsParams, type ApartmentPhoto } from '@workspace/api-client-react';
import { ArrowDownUp, Check, ExternalLink, RefreshCw, Ruler, Search, ShieldAlert, Sun, Waves, X, ShoppingCart, Coffee, Map as MapIcon, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription, DialogHeader } from '@/components/ui/dialog';
import { getDistanceDisplay, getSizeDisplay } from '@/lib/apartmentEstimates';

const currencyFormat = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});
function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

function listingAvailability(listing: ApartmentPairListing) {
  if (listing.availabilityStatus === 'confirmed') return { label: 'Availability confirmed', tone: 'confirmed' as const, icon: Check };
  if (listing.availabilityStatus === 'unavailable') return { label: 'Marked unavailable', tone: 'unavailable' as const, icon: X };
  return { label: 'Availability unknown', tone: 'unknown' as const, icon: ShieldAlert };
}

function GalleryItem({ photo, photos, originalListingUrl }: { photo: ApartmentPhoto, photos: ApartmentPhoto[], originalListingUrl: string }) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="relative h-full w-full overflow-hidden rounded-xl bg-muted/30 border border-dashed border-border flex flex-col items-center justify-center p-3">
        <span className="text-[11px] font-medium text-muted-foreground mb-1.5">Photos unavailable</span>
        <a
          href={originalListingUrl}
          target="_blank"
          rel="noreferrer"
          className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 text-center"
        >
          View original listing <ExternalLink className="h-3 w-3 shrink-0" />
        </a>
      </div>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="relative aspect-[4/3] h-auto w-full overflow-hidden rounded-xl focus:outline-none focus:ring-2 focus:ring-ring hover:opacity-95 transition-opacity bg-muted/30 group">
           <img src={photo.url} alt={photo.alt} onError={() => setError(true)} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl w-[95vw] p-0 bg-background border-border shadow-2xl rounded-2xl overflow-hidden">
        <DialogHeader className="p-5 border-b-2 border-border bg-muted/20">
          <DialogTitle className="font-heading text-xl">Listing Gallery</DialogTitle>
          <DialogDescription className="text-sm">
            Photos retrieved from the original listing source.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-8 p-5 overflow-y-auto max-h-[75vh]">
          {photos.map((p, idx) => (
            <FullSizeGalleryItem key={idx} photo={p} originalListingUrl={originalListingUrl} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FullSizeGalleryItem({ photo, originalListingUrl }: { photo: ApartmentPhoto, originalListingUrl: string }) {
  const [error, setError] = useState(false);

  return (
    <div className="flex flex-col gap-3 bg-muted/10 rounded-xl p-3 border-2 border-border">
      <div className="relative rounded-lg overflow-hidden bg-muted/20 min-h-[250px] flex flex-col items-center justify-center p-4">
         {error ? (
           <>
             <span className="text-sm text-muted-foreground mb-3">Photos unavailable</span>
             <a
               href={originalListingUrl}
               target="_blank"
               rel="noreferrer"
               className="text-sm font-bold text-primary hover:underline flex items-center gap-1.5"
             >
               View original listing <ExternalLink className="h-4 w-4" />
             </a>
           </>
         ) : (
            <img
              src={photo.url}
              alt={photo.alt}
              onError={() => setError(true)}
              className="w-full h-auto max-h-[65vh] object-contain rounded-md shadow-sm"
           />
         )}
      </div>
      <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground px-2 gap-4">
        <span className="max-w-[65%] leading-relaxed">{photo.alt || 'No description provided'}</span>
        <div className="flex flex-wrap items-center gap-4">
          {photo.aiEdited && <span className="text-accent font-bold flex items-center gap-1.5"><Info className="h-3.5 w-3.5"/> AI Edited</span>}
          {photo.attribution && <span className="font-medium">By {photo.attribution}</span>}
          {photo.sourceUrl && (
             <a href={photo.sourceUrl} target="_blank" rel="noreferrer" className="text-primary font-bold hover:text-accent flex items-center gap-1.5 transition-colors">
               Source <ExternalLink className="h-3.5 w-3.5" />
             </a>
          )}
        </div>
      </div>
    </div>
  );
}

type PhotoSubject =
  | 'living'
  | 'balcony'
  | 'view'
  | 'exterior'
  | 'street'
  | 'kitchen'
  | 'bedroom'
  | 'bathroom'
  | 'other';

const subjectPriority: PhotoSubject[] = [
  'living',
  'balcony',
  'view',
  'exterior',
  'street',
  'kitchen',
  'bedroom',
  'bathroom',
  'other',
];

function getPhotoSubject(photo: ApartmentPhoto): PhotoSubject {
  const description = photo.alt.toLocaleLowerCase();

  if (/\b(living|lounge|salon|sitting|dining)\b/.test(description)) return 'living';
  if (/\b(balcony|terrace|patio|roof terrace)\b/.test(description)) return 'balcony';
  if (/\b(view|outlook|sea view|window view)\b/.test(description)) return 'view';
  if (/\b(exterior|facade|façade|building|courtyard|entrance)\b/.test(description)) return 'exterior';
  if (/\b(street|road|neighbourhood|neighborhood)\b/.test(description)) return 'street';
  if (/\b(kitchen)\b/.test(description)) return 'kitchen';
  if (/\b(bedroom)\b/.test(description)) return 'bedroom';
  if (/\b(bathroom|shower|toilet)\b/.test(description)) return 'bathroom';

  return 'other';
}

export function orderPhotosForDiversity(photos: ApartmentPhoto[]): ApartmentPhoto[] {
  const remaining = photos.map((photo) => ({
    photo,
    subject: getPhotoSubject(photo),
  }));
  const ordered: typeof remaining = [];

  for (const subject of subjectPriority) {
    const firstMatch = remaining.findIndex((item) => item.subject === subject);
    if (firstMatch !== -1) {
      ordered.push(remaining.splice(firstMatch, 1)[0]);
    }
  }

  ordered.push(...remaining);
  return ordered.map(({ photo }) => photo);
}

function PhotoGallery({ photos, originalListingUrl }: { photos: ApartmentPhoto[], originalListingUrl: string, pairId: string, aptId: string }) {
  if (!photos || photos.length === 0) {
    return (
      <div className="flex h-64 sm:h-80 w-full flex-col items-center justify-center bg-muted/30 p-4 text-center border border-dashed border-border rounded-xl">
        <span className="text-sm font-medium text-muted-foreground mb-3">Photos unavailable</span>
        <a href={originalListingUrl} target="_blank" rel="noreferrer" className="text-sm font-bold text-primary hover:underline flex items-center gap-1.5">
          View original listing <ExternalLink className="h-4 w-4 shrink-0" />
        </a>
      </div>
    );
  }

  const orderedPhotos = orderPhotosForDiversity(photos);
  const displayPhotos = orderedPhotos.slice(0, 4);

  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-2 gap-3">
        {displayPhotos.map((photo, i) => (
          <GalleryItem key={photo.url} photo={photo} photos={orderedPhotos} originalListingUrl={originalListingUrl} />
        ))}
      </div>
      {photos.length > 4 && (
        <p className="text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
          +{photos.length - 4} more photo{photos.length - 4 === 1 ? '' : 's'} in gallery
        </p>
      )}
    </div>
  );
}

function DistanceItem({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
  const { value: displayValue, isGuesstimate } = getDistanceDisplay(label, value);
  const apartmentValues = displayValue.split(' | ');
  return (
    <div className="flex flex-col gap-1.5" data-testid={`figure-distance-${label.toLowerCase().replace(/[^a-z]+/g, '-')}`}>
      <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground font-bold uppercase tracking-wider">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="text-[13px] sm:text-sm font-semibold text-foreground">
        {apartmentValues.map((apartmentValue, index) => (
          <span key={`${label}-${index}`} className={index === 0 ? 'block' : 'mt-4 block'}>
            {apartmentValue}
          </span>
        ))}
      </div>
      {isGuesstimate && (
        <span className="self-end text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          guesstimate
        </span>
      )}
    </div>
  );
}

function ListingSize({ listing, testId }: { listing: ApartmentPairListing; testId: string }) {
  const { value, isGuesstimate } = getSizeDisplay(listing);
  return (
    <div className="flex flex-col" data-testid={testId}>
      <span>{value}</span>
      {isGuesstimate && (
        <span className="mt-1 self-end text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          guesstimate
        </span>
      )}
    </div>
  );
}

function AvailableApartmentCard({ listing }: { listing: ApartmentPairListing }) {
  const leadPhoto = listing.photos[0];
  return (
    <article className="overflow-hidden rounded-xl border-2 border-border bg-background" data-testid={`card-available-apartment-${listing.id}`}>
      {leadPhoto && (
        <div className="aspect-[16/9] overflow-hidden bg-muted">
          <img
            src={leadPhoto.url}
            alt={leadPhoto.alt}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      )}
      <div className="space-y-3 p-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Available for a future pair</p>
          <h3 className="mt-1 font-heading text-lg font-bold text-foreground">{listing.displayName}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{listing.area}</p>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Monthly rent</p>
            <p className="font-heading text-xl font-bold text-primary">
              {listing.monthlyRentEur === null ? 'Not quoted' : currencyFormat.format(listing.monthlyRentEur)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Size</p>
            <div className="font-semibold">
              <ListingSize listing={listing} testId={`text-available-size-${listing.id}`} />
            </div>
          </div>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">{listing.availabilityNote}</p>
        <Button asChild variant="outline" className="w-full font-bold">
          <a href={listing.originalListingUrl} target="_blank" rel="noreferrer">
            View original listing <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </div>
    </article>
  );
}

function PairCard({ pair, listingReferences }: { pair: ApartmentPair; listingReferences: Record<string, string[]> }) {
  const renderPairReference = (listing: ApartmentPairListing) => {
    const currentPaper = pair.id.replace(/^pair-/i, '');
    const otherPapers = (listingReferences[listing.originalListingUrl] ?? []).filter((paper) => paper !== currentPaper);
    if (otherPapers.length === 0) return null;
    return (
      <p className="mt-2 text-xs font-bold text-primary">
        Also appears in PAPER {otherPapers.join(', ')}
      </p>
    );
  };

  const renderAvail = (listing: ApartmentPairListing) => {
    const availability = listingAvailability(listing);
    const AvailabilityIcon = availability.icon;
    return (
      <div className="flex flex-col gap-1.5">
        <p className={`flex items-center gap-1.5 text-xs sm:text-sm font-bold availability-${availability.tone}`} data-testid={`status-availability-${pair.id}-${listing.id}`}>
          <AvailabilityIcon className="h-4 w-4 shrink-0" />
          {availability.label}
        </p>
        <p className="text-[11px] sm:text-xs leading-relaxed text-muted-foreground font-medium" data-testid={`text-availability-note-${pair.id}-${listing.id}`}>
          {listing.availabilityNote || 'No specific note provided.'}
        </p>
      </div>
    );
  };

  const provisionalNotice = pair.status === 'provisional' ? (
    <div className="w-full px-5 py-4 rounded-xl bg-accent/10 border-2 border-accent/50 text-accent text-sm font-bold flex items-center gap-2.5" data-testid={`text-status-note-${pair.id}`}>
      <Info className="h-4 w-4 shrink-0" />
      Provisional — exact dates unconfirmed
    </div>
  ) : null;

  return (
    <article className="pair-card overflow-hidden border-2 border-border rounded-2xl bg-card shadow-md flex flex-col" data-testid={`card-pair-${pair.id}`}>
      {/* 1. PAPER/pair ID and town */}
      <div className="p-5 sm:p-8 border-b-2 border-border bg-secondary/30 flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-muted-foreground text-xs uppercase tracking-[0.15em] font-bold">
            Paper {pair.id.replace(/^pair-/i, '')} <span className="opacity-40 mx-1">—</span> {pair.areas.join(' / ') || 'Area not stated'}
          </span>
          <Badge variant="outline" className={pair.status === 'verified' ? 'bg-success/10 text-success border-success/30' : 'bg-accent/10 text-accent border-accent/30'}>
            {pair.status === 'verified' ? <Check className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
            {pair.status}
          </Badge>
        </div>
        <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mt-1">
          {pair.areas.join(', ') || 'Area not stated'}
        </h2>
        {pair.combinedMonthlyRentEur !== null && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm font-bold">
            <span className="text-foreground">
              Quoted pair total {currencyFormat.format(pair.combinedMonthlyRentEur)}/month
            </span>
            <span className="rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 text-accent">
              Soft maximum €1,100 total
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* 2 & 3. Paper side */}
        <div className="flex flex-col border-b-2 lg:border-b-0 lg:border-r-2 border-border" data-testid={`panel-listing-${pair.id}-${pair.paper.id}`}>
          <div className="p-5 sm:p-8 flex-1 flex flex-col">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-2">Apt {pair.paper.id}</div>
            <h3 className="font-heading text-xl sm:text-2xl font-bold leading-tight text-foreground mb-6" data-testid={`text-listing-name-${pair.id}-${pair.paper.id}`}>{pair.paper.displayName}</h3>
            {renderPairReference(pair.paper)}

            <div className="mb-8">
              <PhotoGallery photos={pair.paper.photos} originalListingUrl={pair.paper.originalListingUrl} pairId={pair.id} aptId={pair.paper.id} />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-muted/40 p-5 rounded-xl flex flex-col justify-center border-2 border-border">
                <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-1.5">Quoted Monthly Rent</div>
                <div className="font-heading text-2xl sm:text-3xl font-bold text-primary" data-testid={`text-rent-${pair.id}-${pair.paper.id}`}>
                  {pair.paper.monthlyRentEur === null ? <span className="text-sm text-muted-foreground font-normal">Not quoted</span> : currencyFormat.format(pair.paper.monthlyRentEur)}
                </div>
                <div className="mt-1 text-[10px] font-semibold text-muted-foreground">Quoted on the original long-stay listing</div>
              </div>
              <div className="bg-muted/40 p-5 rounded-xl flex flex-col justify-center border-2 border-border">
                <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-1.5">Size</div>
                <div className="font-heading text-xl sm:text-2xl font-bold text-foreground">
                  <ListingSize listing={pair.paper} testId={`text-size-${pair.id}-${pair.paper.id}`} />
                </div>
              </div>
            </div>

            <div className="mb-2 mt-auto">
              {renderAvail(pair.paper)}
            </div>
          </div>

          <div className="px-5 sm:px-8 pb-5 sm:pb-8 flex flex-col gap-3">
            <Button asChild className="w-full h-12 text-sm font-bold shadow-sm rounded-xl" variant="default">
              <a href={pair.paper.originalListingUrl} target="_blank" rel="noreferrer" data-testid={`link-original-listing-${pair.id}-${pair.paper.id}`}>
                View apartment {pair.paper.id} <ExternalLink className="ml-2 h-4 w-4 shrink-0" />
              </a>
            </Button>
            <div className="text-[10px] sm:text-[11px] text-muted-foreground uppercase tracking-widest font-bold text-center" data-testid={`text-source-meta-${pair.id}-${pair.paper.id}`}>
              Checked {formatDate(pair.paper.sourceCheckedAt)}
            </div>
          </div>
        </div>

        {/* 4 & 5. Apartment side */}
        <div className="flex flex-col border-b-2 border-border" data-testid={`panel-listing-${pair.id}-${pair.apartment.id}`}>
          <div className="p-5 sm:p-8 flex-1 flex flex-col">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-2">Apt {pair.apartment.id}</div>
            <h3 className="font-heading text-xl sm:text-2xl font-bold leading-tight text-foreground mb-6" data-testid={`text-listing-name-${pair.id}-${pair.apartment.id}`}>{pair.apartment.displayName}</h3>
            {renderPairReference(pair.apartment)}

            <div className="mb-8">
              <PhotoGallery photos={pair.apartment.photos} originalListingUrl={pair.apartment.originalListingUrl} pairId={pair.id} aptId={pair.apartment.id} />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-muted/40 p-5 rounded-xl flex flex-col justify-center border-2 border-border">
                <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-1.5">Quoted Monthly Rent</div>
                <div className="font-heading text-2xl sm:text-3xl font-bold text-primary" data-testid={`text-rent-${pair.id}-${pair.apartment.id}`}>
                  {pair.apartment.monthlyRentEur === null ? <span className="text-sm text-muted-foreground font-normal">Not quoted</span> : currencyFormat.format(pair.apartment.monthlyRentEur)}
                </div>
                <div className="mt-1 text-[10px] font-semibold text-muted-foreground">Quoted on the original long-stay listing</div>
              </div>
              <div className="bg-muted/40 p-5 rounded-xl flex flex-col justify-center border-2 border-border">
                <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-1.5">Size</div>
                <div className="font-heading text-xl sm:text-2xl font-bold text-foreground">
                  <ListingSize listing={pair.apartment} testId={`text-size-${pair.id}-${pair.apartment.id}`} />
                </div>
              </div>
            </div>

            <div className="mb-2 mt-auto">
              {renderAvail(pair.apartment)}
            </div>
          </div>

          <div className="px-5 sm:px-8 pb-5 sm:pb-8 flex flex-col gap-3">
            <Button asChild className="w-full h-12 text-sm font-bold shadow-sm rounded-xl" variant="default">
              <a href={pair.apartment.originalListingUrl} target="_blank" rel="noreferrer" data-testid={`link-original-listing-${pair.id}-${pair.apartment.id}`}>
                View apartment {pair.apartment.id} <ExternalLink className="ml-2 h-4 w-4 shrink-0" />
              </a>
            </Button>
            <div className="text-[10px] sm:text-[11px] text-muted-foreground uppercase tracking-widest font-bold text-center" data-testid={`text-source-meta-${pair.id}-${pair.apartment.id}`}>
              Checked {formatDate(pair.apartment.sourceCheckedAt)}
            </div>
          </div>
        </div>
      </div>

      {/* 6. Distances */}
      <div className="bg-secondary/20 p-5 sm:p-8 border-b-2 border-border">
         <div className="grid grid-cols-2 md:grid-cols-5 gap-6 sm:gap-8">
           <DistanceItem icon={Waves} label="Pool" value={pair.poolDistance} />
           <DistanceItem icon={Sun} label="Beach" value={pair.beachDistance} />
           <DistanceItem icon={ShoppingCart} label="Groceries" value={pair.groceriesDistance} />
           <DistanceItem icon={Coffee} label="Cafes" value={pair.cafesDistance} />
           <DistanceItem icon={MapIcon} label="Pair Dist." value={pair.pairWalkingDistance} />
         </div>
      </div>

      {/* 7. Summary */}
      <div className="p-5 sm:p-8 bg-background">
        <p className="text-[15px] sm:text-[16px] leading-relaxed text-foreground max-w-5xl whitespace-pre-wrap">{pair.summary}</p>
      </div>

      {/* Provisional notice */}
      {pair.status === 'provisional' && (
        <div className="px-5 pb-5 sm:px-8 sm:pb-8">
          {provisionalNotice}
        </div>
      )}
    </article>
  );
}

function PairRelationshipMap({ pairs }: { pairs: ApartmentPair[] }) {
  const uniqueListings = useMemo(() => {
    const records = new Map<string, { ids: string[]; name: string; papers: string[] }>();
    pairs.forEach((pair) => {
      const paper = pair.id.replace(/^pair-/i, '');
      [pair.paper, pair.apartment].forEach((listing) => {
        const existing = records.get(listing.originalListingUrl);
        if (existing) {
          if (!existing.ids.includes(listing.id)) existing.ids.push(listing.id);
          if (!existing.papers.includes(paper)) existing.papers.push(paper);
        } else {
          records.set(listing.originalListingUrl, {
            ids: [listing.id],
            name: listing.displayName,
            papers: [paper],
          });
        }
      });
    });
    return Array.from(records.values());
  }, [pairs]);

  return (
    <figure className="mb-8 overflow-hidden rounded-2xl border-2 border-border bg-card shadow-sm">
      <div className="border-b-2 border-border p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <MapIcon className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-xl font-bold">Apartment relationship map</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Each green line is a possible pair. Apartments repeat in the cards when they belong to more than one valid combination.
        </p>
      </div>
      <figcaption className="grid gap-3 border-t-2 border-border p-5 sm:grid-cols-3 sm:p-6">
        {uniqueListings.map((listing) => (
          <div key={listing.name} className="rounded-xl bg-muted/40 p-3">
            <p className="text-xs font-black uppercase tracking-wider text-primary">{listing.ids.join(' / ')}</p>
            <p className="mt-1 text-sm font-bold">{listing.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">PAPER {listing.papers.join(', ')}</p>
          </div>
        ))}
        <p className="sm:col-span-3 text-[11px] text-muted-foreground">
          Exact street addresses are not public. Pair distances shown below are area-level estimates and require agent confirmation.
        </p>
      </figcaption>
    </figure>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6" data-testid="state-loading">
      {[1, 2].map((item) => (
        <div className="border-2 border-border rounded-2xl p-6 sm:p-8 bg-card" key={item}>
          <div className="loading-line w-1/4 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-5">
              <div className="loading-panel" />
              <div className="loading-line w-3/4" />
              <div className="loading-line w-1/2" />
            </div>
            <div className="space-y-5">
              <div className="loading-panel" />
              <div className="loading-line w-3/4" />
              <div className="loading-line w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Home() {
  const [status, setStatus] = useState<GetApartmentPairsParams['status']>('all');
  const [area, setArea] = useState('');
  const [sort, setSort] = useState<GetApartmentPairsParams['sort']>('rank');
  const params = useMemo<GetApartmentPairsParams>(() => ({
    status,
    area: area || undefined,
    sort,
  }), [area, sort, status]);
  const { data, isLoading, isError, error, refetch } = useGetApartmentPairs(params);
  const areaOptions = useMemo(() => {
    const areas = data?.pairs.flatMap((pair) => pair.areas) ?? [];
    return Array.from(new Set(areas)).sort((a, b) => a.localeCompare(b));
  }, [data?.pairs]);
  const listingReferences = useMemo(() => {
    const references: Record<string, string[]> = {};
    data?.pairs.forEach((pair) => {
      const paper = pair.id.replace(/^pair-/i, '');
      [pair.paper, pair.apartment].forEach((listing) => {
        references[listing.originalListingUrl] ??= [];
        if (!references[listing.originalListingUrl].includes(paper)) {
          references[listing.originalListingUrl].push(paper);
        }
      });
    });
    return references;
  }, [data?.pairs]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full flex-col bg-background">
      <main className="home-main flex-1 pt-6 sm:pt-10">
        <section className="desk-container" aria-label="Apartment pair research">

          <div className="mb-8 flex flex-col gap-6" data-testid="panel-filters">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold font-heading text-foreground" data-testid="heading-home">Research view</h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-2" data-testid="text-home-intro">Budget: €1,100/month total soft maximum. The split can vary, such as €550 + €550 or €500 + €600. Lower rent is preferred over extra floor area, and homes from about 30 m² are welcome.</p>
              </div>
              <div className="text-sm font-semibold text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md" data-testid="text-result-count">
                {data ? `${data.total} pair${data.total === 1 ? '' : 's'} returned` : 'Preparing view'}
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-4 p-5 bg-card border-2 border-border rounded-2xl shadow-sm">
              <div className="flex-1 min-w-[200px] flex flex-col gap-2">
                <label htmlFor="status-filter" className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">Verification</label>
                <Select value={status} onValueChange={(value) => setStatus(value as GetApartmentPairsParams['status'])}>
                  <SelectTrigger id="status-filter" className="h-11 bg-background" data-testid="select-status-filter"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All records</SelectItem>
                    <SelectItem value="verified">Verified only</SelectItem>
                    <SelectItem value="provisional">Provisional only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[200px] flex flex-col gap-2">
                <label htmlFor="area-filter" className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">Area</label>
                <Select value={area || 'all-areas'} onValueChange={(value) => setArea(value === 'all-areas' ? '' : value)}>
                  <SelectTrigger id="area-filter" className="h-11 bg-background" data-testid="select-area-filter"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-areas">All areas</SelectItem>
                    {areaOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[200px] flex flex-col gap-2">
                <label htmlFor="sort-filter" className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">Order by</label>
                <Select value={sort} onValueChange={(value) => setSort(value as GetApartmentPairsParams['sort'])}>
                  <SelectTrigger id="sort-filter" className="h-11 bg-background" data-testid="select-sort-filter"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rank"><span className="flex items-center gap-2"><ArrowDownUp className="h-3.5 w-3.5" /> Editorial rank</span></SelectItem>
                    <SelectItem value="date-found"><span className="flex items-center gap-2"><ArrowDownUp className="h-3.5 w-3.5" /> Date found — newest first</span></SelectItem>
                    <SelectItem value="beach-distance"><span className="flex items-center gap-2"><Ruler className="h-3.5 w-3.5" /> Beach distance</span></SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(area || status !== 'all' || sort !== 'rank') && (
                <Button variant="ghost" className="h-11 px-5 text-sm font-semibold" data-testid="button-clear-filters" onClick={() => { setStatus('all'); setArea(''); setSort('rank'); }}>
                  Clear filters
                </Button>
              )}
            </div>
          </div>

          {data?.pairs.length ? <PairRelationshipMap pairs={data.pairs} /> : null}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-bold text-muted-foreground mb-6 uppercase tracking-wider px-1">
            <div className="flex items-center gap-2 text-foreground"><Check className="h-4 w-4 text-success" /><span>Source-led review</span></div>
            {data?.reviewedAt && <span data-testid="text-reviewed-at">Last reviewed {formatDate(data.reviewedAt)}</span>}
          </div>

          {isLoading ? <LoadingState /> : isError ? (
            <Card className="border-2 border-border rounded-2xl shadow-sm bg-card" data-testid="state-error">
              <CardContent className="flex flex-col items-center px-6 py-20 text-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10 text-destructive mb-5"><RefreshCw className="h-6 w-6" /></div>
                <h2 className="font-heading text-2xl font-bold text-foreground">The desk could not load the shortlist.</h2>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{error instanceof Error ? error.message : 'The source service returned an unexpected response.'}</p>
                <Button className="mt-8 rounded-xl h-11 px-6 font-bold" data-testid="button-retry-pairs" onClick={() => refetch()}><RefreshCw className="mr-2 h-4 w-4" /> Try again</Button>
              </CardContent>
            </Card>
          ) : data?.pairs.length ? (
            <div data-testid="list-apartment-pairs">
              {data.pairs.map((pair, index) => (
                <div key={pair.id}>
                  <PairCard pair={pair} listingReferences={listingReferences} />
                  {index < data.pairs.length - 1 && (
                    <div aria-hidden="true" className="py-14 flex justify-center">
                      <div className="h-[10px] w-full max-w-[90%] rounded-full bg-gradient-to-r from-background via-foreground/50 to-background shadow-[0_4px_16px_rgba(255,255,255,0.15)] border-t border-b border-foreground/20" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <Card className="border-2 border-border rounded-2xl shadow-sm bg-card" data-testid="state-empty">
              <CardContent className="flex flex-col items-center px-6 py-20 text-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-5"><Search className="h-6 w-6" /></div>
                <h2 className="font-heading text-2xl font-bold text-foreground">No qualifying pair is currently published.</h2>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">Over-budget candidates are excluded. The next research update should publish only pairs near the €1,100 monthly soft maximum.</p>
                <Button variant="outline" className="mt-8 rounded-xl h-11 px-6 font-bold" data-testid="button-reset-empty-filters" onClick={() => { setStatus('all'); setArea(''); setSort('rank'); }}>Reset filters</Button>
              </CardContent>
            </Card>
          )}

          {!isLoading && !isError && data?.availableApartments.length ? (
            <section className="mt-10 rounded-2xl border-2 border-border bg-card p-5 shadow-sm sm:p-7" data-testid="list-available-apartments">
              <div className="mb-5">
                <h2 className="font-heading text-xl font-bold text-foreground">Valid apartments waiting for a match</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  These apartment records passed validation independently. A malformed nearby apartment did not remove them, but they are not presented as qualifying pairs until a separate valid match is found.
                </p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {data.availableApartments.map((listing) => (
                  <AvailableApartmentCard key={listing.id} listing={listing} />
                ))}
              </div>
            </section>
          ) : null}

          {!isLoading && !isError && (
            <details className="group mt-8 overflow-hidden rounded-2xl border-2 border-border bg-card shadow-sm" data-testid="panel-unknown-rent">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-heading text-base font-bold text-foreground marker:content-none">
                <span>Likely over budget or rent not stated</span>
                <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground group-open:bg-primary/10 group-open:text-primary">
                  Expand
                </span>
              </summary>
              <div className="border-t-2 border-border px-5 py-5 text-sm leading-relaxed text-muted-foreground">
                <p>
                  Large beachfront homes with no advertised monthly rent are assumed likely to exceed this search’s budget unless reliable research shows otherwise. They stay out of the qualifying pair count and main shortlist.
                </p>
                <p className="mt-3 font-medium text-foreground">
                  No source-linked listings are currently saved in this category.
                </p>
              </div>
            </details>
          )}

          {data?.disclaimer && (
            <div className="disclaimer mt-8" data-testid="text-disclaimer">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-primary/70" />
              <p>{data.disclaimer}</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

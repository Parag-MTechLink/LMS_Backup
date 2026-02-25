import { useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Configure default marker icon (works in Vite bundle)
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

L.Marker.prototype.options.icon = DefaultIcon

const DEFAULT_CENTER = [22.9734, 78.6569] // India approximate center
const DEFAULT_ZOOM = 5

// Approximate bounding box for India to constrain panning
const INDIA_BOUNDS = L.latLngBounds(
  [6, 68],    // south-west (lat, lng)
  [37.5, 98], // north-east
)

export function LabMap({ labs, selectedLabId, onSelectLab }) {
  const labsWithCoords = useMemo(
    () =>
      (labs || []).filter(
        (lab) =>
          typeof lab.latitude === 'number' &&
          typeof lab.longitude === 'number' &&
          !Number.isNaN(lab.latitude) &&
          !Number.isNaN(lab.longitude)
      ),
    [labs]
  )

  const center = useMemo(() => {
    if (!labsWithCoords.length) return DEFAULT_CENTER
    const selected = labsWithCoords.find((l) => l.lab_id === selectedLabId)
    if (selected) return [selected.latitude, selected.longitude]
    const first = labsWithCoords[0]
    return [first.latitude, first.longitude]
  }, [labsWithCoords, selectedLabId])

  return (
    <MapContainer
      center={center}
      zoom={DEFAULT_ZOOM}
      className="h-full w-full"
      minZoom={4}
      maxZoom={12}
      maxBounds={INDIA_BOUNDS}
      maxBoundsViscosity={1.0}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {labsWithCoords.map((lab) => (
        <Marker
          key={lab.lab_id}
          position={[lab.latitude, lab.longitude]}
          eventHandlers={{
            click: () => onSelectLab && onSelectLab(lab.lab_id),
          }}
        >
          <Popup>
            <div className="space-y-1 text-sm">
              <div className="font-semibold">{lab.lab_name}</div>
              {lab.prime_address && (
                <div className="text-slate-600">{lab.prime_address}</div>
              )}
              {(lab.city || lab.state) && (
                <div className="text-slate-600">
                  {[lab.city, lab.state].filter(Boolean).join(', ')}
                </div>
              )}
              {lab.group_name && (
                <div className="text-xs text-slate-500">
                  Group: {lab.group_name}
                  {lab.sub_group_name ? ` / ${lab.sub_group_name}` : ''}
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}


import { Location } from './Location';
import type { Realm as RealmT, LocationIndex } from '../../engine/types';

interface RealmProps {
  realm: RealmT;
  /** Read-only opponent realms render in a compact, non-interactive layout. */
  readOnly?: boolean;
}

/** A single player's realm: 4 locations laid out horizontally. */
export function Realm({ realm, readOnly = false }: RealmProps): JSX.Element {
  return (
    <div className={`realm ${readOnly ? 'realm--readonly' : ''}`}>
      <h3 className="realm__villain">{realm.villain}</h3>
      <div className="realm__locations">
        {realm.locations.map((loc, idx) => (
          <Location
            key={loc.id}
            location={loc}
            index={idx as LocationIndex}
            readOnly={readOnly}
          />
        ))}
      </div>
    </div>
  );
}

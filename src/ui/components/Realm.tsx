import { Location } from './Location';
import type { Realm as RealmT, LocationIndex, PlayerId } from '../../engine/types';

interface RealmProps {
  realm: RealmT;
  /** Which player owns this realm — needed for in-play removal. */
  owner: PlayerId;
  /** Read-only opponent realms render in a compact, non-interactive layout. */
  readOnly?: boolean;
}

/** A single player's realm: 4 locations laid out horizontally. */
export function Realm({ realm, owner, readOnly = false }: RealmProps): JSX.Element {
  return (
    <div className={`realm ${readOnly ? 'realm--readonly' : ''}`}>
      <h3 className="realm__villain">{realm.villain}</h3>
      <div className="realm__locations">
        {realm.locations.map((loc, idx) => (
          <Location
            key={loc.id}
            location={loc}
            index={idx as LocationIndex}
            owner={owner}
            readOnly={readOnly}
          />
        ))}
      </div>
    </div>
  );
}

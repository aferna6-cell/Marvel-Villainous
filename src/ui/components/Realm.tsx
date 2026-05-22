import { Location } from './Location';
import type { Realm as RealmT, LocationIndex } from '../../engine/types';

interface RealmProps {
  realm: RealmT;
}

/** A single player's realm: 4 locations laid out horizontally. */
export function Realm({ realm }: RealmProps): JSX.Element {
  return (
    <div className="realm">
      <h3 className="realm__villain">{realm.villain}</h3>
      <div className="realm__locations">
        {realm.locations.map((loc, idx) => (
          <Location key={loc.id} location={loc} index={idx as LocationIndex} />
        ))}
      </div>
    </div>
  );
}

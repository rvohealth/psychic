export default {
  "health_users": {},
  "pets": {
    "user": [
      "users"
    ]
  },
  "users": {
    "pets": [
      "pets"
    ]
  }
}

export interface SyncedAssociations {
  "health_users": {},
  "pets": {
    "user": [
      "users"
    ]
  },
  "users": {
    "pets": [
      "pets"
    ]
  }
}

export interface SyncedBelongsToAssociations {
  "health_users": false,
  "pets": {
    "user": [
      "users"
    ]
  },
  "users": false
}
  

export interface VirtualColumns {
  "health_users": false,
  "pets": false,
  "users": [
    "password"
  ]
}

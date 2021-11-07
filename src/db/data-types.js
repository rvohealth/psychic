
// note: this file is a low-level file, imported by many others.
// as such, it is advised to keep importing in here to a minimum
// to avoid build complications

export default class DataTypes {
  // note: array is not a real data type, but instead is applied to all datatypes.
  // Our app supports passing an array type, which is translated by the DB adapter
  // and reformulated to be a datatype with an array attached.
  static ARRAY = 'array'

  static BIGINT = 'bigint' //	int8	signed eight-byte integer
  static BIGSERIAL = 'bigserial' // serial8	autoincrementing eight-byte integer
  static BIT = 'bit' // bit [ (n) ]	fixed-length bit string
  static BOOL = 'boolean'	// bool	logical Boolean (true/false)
  static BOX = 'box' // rectangular box on a plane
  static BYTEA = 'bytea' // binary data ("byte array")
  static CHAR = 'char' // character [ (n) ]	char [ (n) ]	fixed-length character string
  static CIDR = 'cidr' // cidr IPv4 or IPv6 network address
  static CIRCLE = 'circle' // circle on a plane
  static DATE = 'date' // calendar date (year, month, day)
  static DOUBLE = 'double' // precision	float8	double precision floating-point number (8 bytes)
  static FLOAT = 'float'
  static INET = 'inet' // IPv4 or IPv6 host address
  static INT = 'int' // integer	int, int4	signed four-byte integer
  static INTERVAL = 'interval' // interval [ fields ] [ (p) ]	 	time span
  static JSON = 'json' // textual JSON data
  static JSONB = 'jsonb' // binary JSON data, decomposed
  static LINE = 'line' // infinite line on a plane
  static LSEG = 'lseg' // line segment on a plane
  static MACADDR = 'macaddr' // MAC (Media Access Control) address
  static MONEY = 'money' // currency amount
  static NUMERIC = 'numeric' // numeric [ (p, s) ]	decimal [ (p, s) ]	exact numeric of selectable precision
  static PATH = 'path' // geometric path on a plane
  static PGLSN = 'pg_lsn' // pg_lsn	 	PostgreSQL Log Sequence Number
  static POINT = 'point' // geometric point on a plane
  static POLYGON = 'polygon' // closed geometric path on a plane
  static REAL = 'real' // real	float4	single precision floating-point number (4 bytes)
  static SMALLINT = 'smallint'	// int2	signed two-byte integer
  static SMALLSERIAL = 'smallserial' // serial2	autoincrementing two-byte integer
  static SERIAL = 'serial' // serial	serial4	autoincrementing four-byte integer
  static STRING = 'string'
  static TEXT = 'text' // variable-length character string
  static TIME = 'time' // [ (p) ] [ without time zone ]	 	time of day (no time zone)
  static TIMEZ = 'timez' // alias for TIME WITH TIME ZONE
  static TIMESTAMP = 'timestamp' // timestamp [ (p) ] without time zone	timestamptz	date and time, including time zone
  static TIMESTAMPZ = 'timestampz' // timestamp [ (p) ] with time zone	timestamptz	date and time, including time zone
  static TSQUERY = 'tsquery' // text search query
  static TSVECTOR = 'tsvector' // text search document
  static TXID_SNAPSHOT = 'txid_snapshot' // user-level transaction ID snapshot
  static UUID = 'uuid' // universally unique identifier
  static VARBIT = 'varbit' // bit varying [ (n) ]	varbit [ (n) ]	variable-length bit string
  static VARCHAR = 'varchar' // character varying [ (n) ]	varchar [ (n) ]	variable-length character string
  static XML = 'xml'

  static ALL = [
    this.BIGINT,
    this.BIGSERIAL,
    this.BIT,
    this.BOOL,
    this.BOX,
    this.BYTEA,
    this.CHAR,
    this.CIDR,
    this.CIRCLE,
    this.DATE,
    this.DOUBLE,
    this.FLOAT,
    this.INET,
    this.INT,
    this.INTERVAL,
    this.JSON,
    this.JSONB,
    this.LINE,
    this.LSEG,
    this.MACADDR,
    this.MONEY,
    this.NUMERIC,
    this.PATH,
    this.PGLSN,
    this.POINT,
    this.POLYGON,
    this.REAL,
    this.SMALLINT,
    this.SMALLSERIAL,
    this.SERIAL,
    this.TEXT,
    this.TIME,
    this.TIMESTAMP,
    this.TSQUERY,
    this.TSVECTOR,
    this.TXID_SNAPSHOT,
    this.UUID,
    this.VARBIT,
    this.VARCHAR,
    this.XML,
  ]

  static ALIASES = {
    [this.STRING]: this.TEXT,
  }

  static lookup(type, constraints=null) {
    const explicitType = this.ALL.find(t => t === type)
    if (!constraints && explicitType) return explicitType

    if (this.ALIASES[type]) return this.ALIASES[type]

    return explicitType

    // if (explicitType) {
    // } else {
    //   switch(type) {
    //   case 'ARRAY':
    //     return
    //   default:
    //     return null
    //   }
    // }
  }

  static typeString(type, constraints={}) {
    switch(type) {
    case this.ARRAY:
      return `${constraints.datatype.toUpperCase()} []`

    case this.BIT:
    case this.CHAR:
      return constraints.size !== undefined ?
        `${type.toUpperCase()}(${constraints.size})` :
        `${type.toUpperCase()}`

    case this.DOUBLE:
      return 'DOUBLE PRECISION'

    case this.INT:
      if (constraints.increment)
        return 'SERIAL'

      return 'INT'

    case this.NUMERIC:
      if (constraints.precision === undefined && constraints.scale === undefined)
        return 'NUMERIC'

      if (constraints.scale !== undefined && constraints.precision === undefined)
        throw "must pass precision if passing scale"

      return `NUMERIC(${constraints.precision}, ${constraints.scale || 0})`

    case this.TIMEZ:
      return `TIME WITH TIME ZONE`

    case this.TIMESTAMPZ:
      return `TIMESTAMP WITH TIME ZONE`

    default:
      return this.lookup(type, constraints)?.toUpperCase()
    }
  }
}

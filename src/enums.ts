export enum FeedDateRange {
  ONE_HOUR = '1H',
  ONE_DAY = '1D',
  ONE_WEEK = '1W',
  ONE_MONTH = '1M',
  ONE_YEAR = '1Y',
}

export enum PriceFeedType {
  LINE = 'LINE',
  CANDLE = 'CANDLE',
}

export enum VolumeFeedType {
  LINE = 'LINE',
  BAR = 'BAR',
}

export enum FeedResolution {
  ONE_MIN = '1',
  FIVE_MIN = '5',
  FIFTEEN_MIN = '15',
  HOURLY = '1H',
  FOUR_HOUR = '4H',
  DAILY = '1D',
  WEEKLY = '1W',
  MONTHLY = '1M',
  YEARLY = '1Y',
}

export enum SourceType {
  DEX = 'DEX',
  MARKET_MAKER = 'MARKET_MAKER',
  TOKEN_WRAPPER = 'TOKEN_WRAPPER',
  ORDERBOOK = 'ORDERBOOK',
}

export enum DcaTradeStatus {
  CANCELLED = 'CANCELLED',
  PENDING = 'PENDING',
  SUCCEEDED = 'SUCCEEDED',
}

export enum DcaOrderStatus {
  INDEXING = 'INDEXING',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
}

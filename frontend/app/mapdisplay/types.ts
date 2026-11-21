export type Item = {
  name: string;
  qty: number;
  price: number;
  soldBy: string;
}

export type Stop = {
  name: string;
  retailer: string;
  address: string;
  lat: number;
  lng: number;
  items: Item[];
}

export type Location = {
  lat: number;
  lng: number;
  display: string;
}

export type Leg = {
  duration: number;
  coords: [number, number][];
}

export type Route = {
  start: Location;
  stops: Stop[];
  legs: Leg[];
}

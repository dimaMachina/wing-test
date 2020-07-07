export interface Parcel {
  order_id: string
  weight: number
  tracking_id: string
  palette_number: number
  items: {
    item_id: string
    quantity: number
  }[]
}

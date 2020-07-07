export interface Order {
  id: string
  date: string
  items: {
    item_id: string
    quantity: number
  }[]
}

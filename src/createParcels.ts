import { promises as fs } from 'fs'
import axios from 'axios'
import { Item, Order, Parcel } from './interfaces'

const generateTrackingId = async (): Promise<string> => {
  const response = await axios.post('https://helloacm.com/api/random/?n=15')
  return response.data
}

const parseFile = async (path: string) => {
  const fileData = await fs.readFile(path, 'utf-8')
  return JSON.parse(fileData)
}

export const createParcels = async (): Promise<Parcel[]> => {
  const { items } = (await parseFile('./src/data/items.json')) as {
    items: Item[]
  }
  const { orders } = (await parseFile('./src/data/orders.json')) as {
    orders: Order[]
  }

  const itemsHash = items.reduce((acc: { [id: string]: Item }, doc: Item) => {
    acc[doc.id] = doc
    return acc
  }, {})

  let currentPalette = 1
  let numOfParcels = 0

  const getParcelsForOrder = (order: Order) => {
    console.info(`Creating parcels for order with id ${order.id}`)

    const parcelsForOrder: Omit<Parcel, 'tracking_id'>[] = []

    for (const { item_id, quantity } of order.items) {
      const weight = Number(itemsHash[item_id].weight)

      for (let i = 0; i < quantity; i++) {
        // find parcel where weight if less then 30 kg plus weight of current item
        const matchedParcel = parcelsForOrder.find(
          (parcel) => parcel.weight + weight <= 30
        )

        if (matchedParcel) {
          // check if there is item with matched id
          const itemExists = matchedParcel.items.find(
            (item) => item.item_id === item_id
          )
          if (itemExists) {
            itemExists.quantity += 1
          } else {
            matchedParcel.items.push({ item_id, quantity: 1 })
          }
          // update weight
          matchedParcel.weight += weight
          continue
        }

        if (numOfParcels < 15) {
          numOfParcels += 1
        } else {
          currentPalette++
          numOfParcels = 1
        }

        // create new parcel
        parcelsForOrder.push({
          weight,
          order_id: order.id,
          items: [{ item_id, quantity: 1 }],
          palette_number: currentPalette,
        })
      }
    }
    return parcelsForOrder
  }

  const parcels = orders.reduce((acc: Omit<Parcel, 'tracking_id'>[], order) => {
    const parcelsForOrders = getParcelsForOrder(order)
    acc.push(...parcelsForOrders)
    return acc
  }, [])

  return Promise.all(
    parcels.map(async (parcel) => ({
      ...parcel,
      tracking_id: await generateTrackingId(),
    }))
  )
}

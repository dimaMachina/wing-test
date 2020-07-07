import { promises as fs } from 'fs'
import axios from 'axios'
import { Item, Order, Parcel } from './interfaces'

const generateTrackingId = async (): Promise<string> => {
  const response = await axios.post('https://helloacm.com/api/random/?n=15')
  return response.data
}

const parseFile = async <T extends { id: string }>(
  path: string,
  fieldName: string
) => {
  const fileData = await fs.readFile(path, 'utf-8')
  const parsedData = JSON.parse(fileData)[fieldName] as T[]

  return parsedData.reduce((acc: { [id: string]: T }, doc) => {
    acc[doc.id] = doc
    return acc
  }, {})
}

const getPrice = (weight: number) => {
  if (weight > 20) return 10
  if (weight > 10) return 5
  if (weight > 5) return 3
  if (weight > 1) return 2
  return 1
}

const start = async () => {
  const items = await parseFile<Item>('./src/data/items.json', 'items')
  const orders = await parseFile<Order>('./src/data/orders.json', 'orders')

  let currentPalette = 1
  let numOfParcels = 0

  const getParcelsForOrder = async (order: Order) => {
    console.info(`Creating parcels for order with id ${order.id}`)

    const parcelsForOrder: Parcel[] = []

    for (const { item_id, quantity } of order.items) {
      const item = items[item_id]
      for (let i = 0; i < quantity; i++) {
        // find parcel where weight if less then 30 kg plus weight of current item
        const matchedParcel = parcelsForOrder.find(
          (parcel) => Number(parcel.weight) + Number(item.weight) <= 30
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
          matchedParcel.weight += Number(item.weight)
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
          order_id: order.id,
          items: [{ item_id, quantity: 1 }],
          weight: Number(item.weight),
          tracking_id: await generateTrackingId(),
          palette_number: currentPalette,
        })
      }
    }
    return parcelsForOrder
  }

  const parcels: Parcel[] = []

  await Promise.all(
    Object.values(orders).map((order) =>
      getParcelsForOrder(order).then((parcelsForOrder) => {
        parcels.push(...parcelsForOrder)
      })
    )
  )

  let total = 0

  parcels.forEach((parcel) => {
    const priceForParcel = getPrice(parcel.weight)
    console.log(parcel, `Price: ${priceForParcel} €`)
    total += priceForParcel
  })
  console.log(`Total profit: ${total} €`)
}

start().catch(console.error)

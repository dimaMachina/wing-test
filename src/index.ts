import { createParcels } from './createParcels'

const getPrice = (weight: number) => {
  if (weight > 20) return 10
  if (weight > 10) return 5
  if (weight > 5) return 3
  if (weight > 1) return 2
  return 1
}

createParcels().then((parcels) => {
  let total = 0

  parcels.forEach((parcel) => {
    const priceForParcel = getPrice(parcel.weight)
    console.log(parcel, `Price: ${priceForParcel} €`)
    total += priceForParcel
  })

  console.log(`Total profit: ${total} €`)
})

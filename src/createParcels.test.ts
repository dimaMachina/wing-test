import { createParcels } from './createParcels'
import { Parcel } from './interfaces'

describe('createParcels()', () => {
  let parcels: Parcel[]

  beforeAll(async () => {
    // skip console.info logs
    console.info = () => {}

    parcels = await createParcels()
  })

  it('tracking_id must be unique', () => {
    const totalUniqueIds = new Set(parcels.map((p) => p.tracking_id)).size
    expect(totalUniqueIds).toBe(parcels.length)
  })

  it('should have max 15 parcels per palette', () => {
    const hash: { [paletteId: number]: number } = {}

    parcels.forEach((parcel) => {
      const num = parcel.palette_number
      if (hash[num]) {
        hash[num]++
      } else {
        hash[num] = 1
      }
    })

    const values = Object.values(hash)
    // delete last element for hash values because last palette can be not completely filled
    delete values[values.length - 1]

    expect(values.every((num) => num === 15)).toBe(true)
  })

  it('weight must be less than 30kg', () => {
    const weights = parcels.map((parcel) => parcel.weight)
    expect(weights.every((weight) => weight <= 30)).toBe(true)
  })
})

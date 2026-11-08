/** Sprite URLs for the four angles of a Pokémon (null when the API has none). */
export interface SpriteSet {
  front: string | null
  shiny: string | null
  back: string | null
  backShiny: string | null
}

/** Sprites of both sexes; `female` is only filled when the species looks different. */
export interface Sprites extends SpriteSet {
  female: SpriteSet
}

export type SpriteKey = keyof SpriteSet

export interface Pokemon {
  id: number
  name: string
  /** Default front sprite (kept for compatibility with older code). */
  sprite: string | null
  /** Static sprites. */
  sprites: Sprites
  /** Animated GIF sprites (generation V or Showdown). */
  animated: Sprites
  cry: string | null
  types: string[]
  heightM: number
  weightKg: number
}

export interface PokemonListItem {
  id: number
  name: string
}

export interface PokedexEntry {
  pokemon: Pokemon
  text: string
  /** -1 genderless, 0 male only, 8 female only, 1-7 both; null = unknown. */
  genderRate: number | null
}

export type Status = 'idle' | 'loading' | 'error'
export type Gender = 'male' | 'female'

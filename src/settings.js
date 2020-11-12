var Rest = {}

Rest.host = () => {
    return 'https://pokeapi.co/api/v2/';
};

Rest.region         = Rest.host + 'region';
Rest.pokedex        = Rest.host + 'pokedex';
Rest.type           = Rest.host + 'type'; 
Rest.ability        = Rest.host + 'ability';
Rest.pokemonName    = Rest.host + 'pokemon/';

module.expoorts = {

    rest : Rest,

    settings : {
        
    }


}
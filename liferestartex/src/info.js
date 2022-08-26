class Info{

    TYPES = {
        version_main: 0x1,
        build_date: 0x2,
        release_edition: 0x4,
        build_variant: 0x8,
        update_content: 0x16
    }

    #info = {};

    constructor(){}

    initial(information){
        const {version_main, build_date, release_edition, build_variant, update_content} = information;
        this.#info = {
            [this.TYPES.version_main]: version_main,
            [this.TYPES.build_date]: build_date,
            [this.TYPES.release_edition]: release_edition,
            [this.TYPES.build_variant]: build_variant,
            [this.TYPES.update_content]: update_content
        };
        console.log(information, this.#info);
    }

    get(prop){
        return this.#info[prop];
    }

}

export default Info;
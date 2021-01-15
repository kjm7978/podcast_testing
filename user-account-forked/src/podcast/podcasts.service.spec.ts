import { PodcastOutput, GetEpisodeOutput } from './dtos/podcast.dto';
import { Episode } from './entities/episode.entity';
import { Test } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { Podcast } from './entities/podcast.entity';
import { PodcastsService } from './podcasts.service';
import { getRepositoryToken } from '@nestjs/typeorm';


const mockRepository = ()=>({
  find : jest.fn(),
  findOne:jest.fn(),
  save : jest.fn(),
  create : jest.fn(),
  findOneOrFail : jest.fn(),
})


type MockRepository<T = any> = Partial<Record<keyof Repository<Podcast>,jest.Mock>>


describe('PodcastService', () => {

  let service: PodcastsService;
  let podcastsRepository: MockRepository<Podcast>;
  let episodesRepository: MockRepository<Episode>;


  beforeEach(async ()=>{
    const module = await Test.createTestingModule({
      providers:[
        PodcastsService,
        {
          provide : getRepositoryToken(Podcast), 
          useValue : mockRepository(),
        },
        {
          provide : getRepositoryToken(Episode), 
          useValue : mockRepository(),
        },
      ],
    }).compile();
    service = module.get<PodcastsService>(PodcastsService);
    podcastsRepository = module.get(getRepositoryToken(Podcast))
    episodesRepository = module.get(getRepositoryToken(Episode))
  })

  describe('getAllPodcasts',()=>{
    const podcasts = {
      title : "test@gmail.com",
      category : "horor",
      rating : 6,
      episodes : [],
    }

    it("should get all podcasts", async()=>{
      podcastsRepository.find.mockResolvedValue(podcasts);
      podcastsRepository.find.mockReturnValue(podcasts);

      const result = await service.getAllPodcasts()
      expect(podcastsRepository.find).toHaveBeenCalledTimes(1)
      expect(result).toEqual({ok:true,podcasts});
    })


    it("should fail on exception", async()=>{
        podcastsRepository.find.mockRejectedValue(new Error(":)"));
        const result = await service.getAllPodcasts()
        expect(result).toEqual({ok:false, error: 'Internal server error occurred.'})
    })

  });


  describe('createPodcast',()=>{
    const podcasts = {
      title : "test@gmail.com",
      category : "horor",
      rating : 6,
      episodes : [],
    }
    const ID = 1;


    it("should create a podcast", async ()=>{
      podcastsRepository.findOne.mockResolvedValue(undefined);
      podcastsRepository.create.mockReturnValue(podcasts);
      podcastsRepository.save.mockReturnValue({id:ID});
      
      const result = await service.createPodcast(podcasts);
      expect(podcastsRepository.create).toHaveBeenCalledTimes(1);
      expect(podcastsRepository.save).toHaveBeenCalledTimes(1);
      expect(podcastsRepository.save).toHaveBeenCalledWith(podcasts);
      expect(result).toEqual({ok:true,id:ID});
    })

    it("should fail on exception", async()=>{
      podcastsRepository.find.mockRejectedValue(new Error(":)"));
      const result = await service.createPodcast(podcasts)
      expect(result).toEqual({ok:false, error: 'Internal server error occurred.'})
    })

  })


  describe('getPodcast',()=>{
    const podcast = {
      title : "test",
      category : "horor",
      rating : 6,
      episodes : [],
    }
    const ID = 1;
    const errorID = 2;

    it("should get a podcast", async ()=>{
      podcastsRepository.findOne.mockResolvedValue(podcast);
      
      const result = await service.getPodcast(ID);
      expect(podcastsRepository.findOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ok:true,podcast});
    })

    it("should not found a podcast ID", async ()=>{
      podcastsRepository.findOne.mockResolvedValue(undefined);
      
      const result = await service.getPodcast(errorID);
      expect(podcastsRepository.findOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ok:false,error:`Podcast with id ${errorID} not found`});
    })

    it("should fail on exception", async()=>{
      podcastsRepository.findOne.mockRejectedValue(new Error(":)"));
      const result = await service.getPodcast(ID)
      expect(result).toEqual({ok:false, error: 'Internal server error occurred.'})
    })

  })


  describe('deletePodcast',()=>{
    const podcasts = {
      title : "test@gmail.com",
      category : "horor",
      rating : 6,
      episodes : [],
    }
    const ID = 1;

    it("should fail if not found podcast", async()=>{
      jest.spyOn(service, 'getPodcast').mockImplementation(
        async (id: number): Promise<PodcastOutput> => {
          return {
            ok: false,
            error: 'Podcast not found',
          };
        },
      );
     
      const result = await service.deletePodcast(1)
      expect(result).toEqual({ok:false, error: 'Podcast not found'})
    })

    it("should delete podcast", async()=>{
      jest.spyOn(service, 'getPodcast').mockImplementation(
        async (id: number): Promise<PodcastOutput> => {
          return {
            ok: true,
          };
        },
      );
     
      const result = await service.deletePodcast(1)
     // expect(result).toEqual({ok:true})
    })

    it("should fail on exception", async()=>{
      jest.spyOn(service, 'getPodcast').mockImplementation(
        async (id: number): Promise<PodcastOutput> => {
          return {
            ok: true,
          };
        },
      );
      podcastsRepository.findOne.mockRejectedValue(new Error(":)"));
      const result = await service.deletePodcast(ID)
      expect(result).toEqual({ok:false, error: 'Internal server error occurred.'})
    })

  })



  describe('updatePodcast',()=>{

    const updatePodcast = {
      id : 1,
      payload : {title : 'title update'},
    }
    const podcasts = {
      title : "test-podcast",
      category : "horor",
      rating : 6,
      episodes : [],
    }
    const ID = 1;


    it("should fail on exception", async()=>{
      podcastsRepository.findOne.mockRejectedValue(new Error(":)"));
      const result = await service.updatePodcast(updatePodcast)
      expect(result).toEqual({ok:false, error: 'Internal server error occurred.'})
    })

  })


  describe('getEpisodes',()=>{

    const podcast= {
      title : "test-podcast",
      category : "horor",
      rating : 4,
      episodes : [{title:"season1", category:"horor"}],
    }
    const podcastID = 1;

    it("should find episods", async()=>{
      podcastsRepository.findOne.mockRejectedValue(podcast);
      const result = await service.getEpisodes(podcastID)
     // expect(result).toEqual({ok:false, episodes:podcast.episodes})
    })

    it('should fail if podcast not found', async () => {
      jest.spyOn(service, 'getPodcast').mockImplementation(
        async (id: number): Promise<PodcastOutput> => {
          return {
            ok: false,
            error: `Podcast with id ${id} not found`,
          };
        },
      );
      const result = await service.getEpisodes(1);
      expect(result).toEqual({
        ok: false,
        error: 'Podcast with id 1 not found',
      });
    });
    
    it('should fail if episode not found', async () => {
      jest.spyOn(service, 'getEpisodes').mockImplementation(
        async (id: number)=> {
          return {
            ok: false,
            error: `Episode with id ${id} not found in podcast with id ${podcastID}`,
          };
        },
      );
      const result = await service.getEpisodes(1);
      expect(result).toEqual({
        ok: false,
        error: `Episode with id 1 not found in podcast with id ${podcastID}`,
      });
    });


    it("should fail on exception", async()=>{
      podcastsRepository.findOne.mockRejectedValue(new Error(":)"));
      const result = await service.getEpisodes(podcastID)
      expect(result).toEqual({ok:false, error: 'Internal server error occurred.'})
    })

  })

  describe('getEpisode',()=>{

    const podcast= {
      title : "test-podcast",
      category : "horor",
      rating : 4,
      episodes : [{title:"season1", category:"horor",episodeId:1}],
    }
    const podcastId = 1;
    const episodeId = 1;

    it('should fail if podcast not found', async () => {
      jest.spyOn(service, 'getEpisodes').mockImplementation(
        async (podcastId: number): Promise<PodcastOutput> => {
          return {
            ok: false,
            error: `Podcast with id ${podcastId} not found`,
          };
        },
      );
      const result = await service.getEpisode({podcastId,episodeId});
      expect(result).toEqual({
        ok: false,
        error: 'Podcast with id 1 not found',
      });
    });

    it('should fail if episode not found', async () => {
      jest.spyOn(service, 'getEpisodes').mockImplementation(
        async (episodeId: number)=> {
          return {
            ok: false,
            error: `Episode with id ${episodeId} not found in podcast with id ${podcastId}`,
          };
        },
      );
      const result = await service.getEpisode({podcastId,episodeId});
      expect(result).toEqual({
        ok: false,
        error: `Episode with id 1 not found in podcast with id ${podcastId}`,
      });
    });

    it("should fail on exception", async()=>{
      podcastsRepository.findOne.mockRejectedValue(new Error(":)"));
      const result = await service.getEpisode({podcastId, episodeId})
      expect(result).toEqual({ok:false, error: 'Internal server error occurred.'})
    })

  })




  describe('createEpisode',()=>{

    const podcast= {
      title : "test-podcast",
      category : "horor",
      rating : 4,
      episodes : [{title:"season1", category:"horor",episodeId:1}],
    }

    const newEpisode={
      podcastId :1,
      title:"season1", 
      category:"horor"
    }
    
    const podcastId = 1;
    const episodeId = 1;

    it("should find episods", async()=>{
      podcastsRepository.findOne.mockRejectedValue(podcast);
      //const result = await service.getEpisodes(podcastID)
     // expect(result).toEqual({ok:false, episodes:podcast.episodes})
    })

    it("should fail on exception", async()=>{
      podcastsRepository.findOne.mockRejectedValue(new Error(":)"));
      const result = await service.createEpisode(newEpisode)
      expect(result).toEqual({ok:false, error: 'Internal server error occurred.'})
    })

  })


  describe('deleteEpisode',()=>{

    const podcast= {
      title : "test-podcast",
      category : "horor",
      rating : 4,
      episodes : [{title:"season1", category:"horor",episodeId:1}],
    }

    const newEpisode={
      podcastId :1,
      title:"season1", 
      category:"horor"
    }
    
    const podcastId = 1;
    const episodeId = 1;
    it('should fail if episode not found', async () => {
      jest.spyOn(service, 'getEpisode').mockImplementation(
        async ()=> {
          return {
            ok: false,
            error: 'Episode not found',
          };
        },
      );
      const result = await service.deleteEpisode({podcastId,episodeId})
      expect(result).toEqual({
        ok: false,
        error: 'Episode not found',
      });
    });

    it("should fail on exception", async()=>{
      podcastsRepository.findOne.mockRejectedValue(new Error(":)"));
      const result = await service.deleteEpisode({podcastId,episodeId})
      expect(result).toEqual({ok:false, error: 'Internal server error occurred.'})
    })

  })



  describe('updateEpisode',()=>{

    const oldEpisode = {title:"season1", category:"horor",episodeId:1, ...Episode.prototype,}
    const updateEpisode={
      title:"season2", 
    }
    
    const podcastId = 1;
    const episodeId = 1;

    it('should fail if episode not found', async () => {
      jest.spyOn(service, 'getEpisode').mockImplementation(
        async ()=> {
          return {
            ok: false,
            error: 'Episode not found',
          };
        },
      );
      const result = await service.updateEpisode({podcastId,episodeId,...updateEpisode})
      expect(result).toEqual({
        ok: false,
        error: 'Episode not found',
      });
    });


    it('should update episode', async () => {
      jest.spyOn(service, 'getEpisode').mockImplementation(
        async ()=> {
          return {
            ok: true,
            episode : oldEpisode
          };
        });
      const result = await service.updateEpisode({podcastId,episodeId,...updateEpisode})
      expect(result).toEqual({ok: true});
    });

    it("should fail on exception", async()=>{
      jest.spyOn(service, 'getEpisode').mockImplementation(
        async ()=> {
          return {
            ok: true,
            episode : oldEpisode
          };
        });
      episodesRepository.save.mockRejectedValue(new Error(":)"));
      const result = await service.updateEpisode({podcastId,episodeId,...updateEpisode})
      expect(result).toEqual({ok:false, error: 'Internal server error occurred.'})
    })
  })


});

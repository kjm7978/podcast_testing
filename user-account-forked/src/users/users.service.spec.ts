import { JwtService } from 'src/jwt/jwt.service';
import { User } from './entities/user.entity';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from 'src/users/users.service';
import { Repository } from 'typeorm';


const mockRepository = ()=>({
  findOne:jest.fn(),
  save : jest.fn(),
  create : jest.fn(),
  findOneOrFail : jest.fn(),
})

const mockJwtService = ()=>({
  sign : jest.fn(()=>"signed-token"),
  verify : jest.fn(),
})

type MockRepository<T = any> = Partial<Record<keyof Repository<User>,jest.Mock>>

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: MockRepository<User>;
  let jwtService : JwtService;

  beforeEach(async ()=>{
    const module = await Test.createTestingModule({
      providers:[
        UsersService,
        {
          provide : getRepositoryToken(User), 
          useValue : mockRepository(),
        },
        {
          provide : JwtService, 
          useValue : mockJwtService(),
        },
      ],
    }).compile();
    service = module.get<UsersService>(UsersService);
    usersRepository = module.get(getRepositoryToken(User))
    jwtService = module.get<JwtService>(JwtService);
  })

  it("should be defined",()=>{
    expect(service).toBeDefined();
  })

  describe('createAccount', ()=>{
      const createAccountArgs = {
        email : "test@gmail.com",
        password : "",
        role : null,
      }

      it("should fail if user exists", async ()=>{
        usersRepository.findOne.mockResolvedValue({
          id:1,
          email:"test@gmail.com",
        });
        const result = await service.createAccount(createAccountArgs)
        expect(result).toMatchObject(
          { ok: false, error: `There is a user with that email already` }
        )
      })

      it("should create a new user", async ()=>{
        usersRepository.findOne.mockResolvedValue(undefined);
        usersRepository.create.mockReturnValue(createAccountArgs);
        usersRepository.save.mockResolvedValue(createAccountArgs);
        
        const result = await service.createAccount(createAccountArgs);
        expect(usersRepository.create).toHaveBeenCalledTimes(1);
        expect(usersRepository.create).toHaveBeenCalledWith(createAccountArgs);
        expect(usersRepository.save).toHaveBeenCalledTimes(1);
        expect(usersRepository.save).toHaveBeenCalledWith(createAccountArgs);
        expect(result).toEqual({ok:true,error:null});
      })

      it("should fail on exception", async()=>{
        usersRepository.findOne.mockRejectedValue(new Error(":)"));
        const result = await service.createAccount(createAccountArgs)
        expect(result).toEqual({ok:false, error:"Could not create account"})
    })
  })



  describe('login',()=>{
    const loginARgs={
        email : "test@email.com",
        password : "test",
    }

    it("should fail if user does not exist", async ()=>{
    
        usersRepository.findOne.mockResolvedValue(null);

        const result = await service.login(loginARgs)
        expect(result).toEqual({ok:false, error :"User not found"})
        expect(usersRepository.findOne).toHaveBeenCalledTimes(1)
        expect(usersRepository.findOne).toHaveBeenCalledWith(
            expect.any(Object),expect.any(Object),)
        expect(result).toEqual({
          ok: false, error: 'User not found' 
        })
    })

    it('should fail if the password is wrong', async ()=>{
        const mockedUser ={
            id:1,
            checkPassword : jest.fn(()=>Promise.resolve(false)),
        }
        usersRepository.findOne.mockResolvedValue(mockedUser);
        const result = await service.login(loginARgs);
        expect(result).toEqual({ok:false, error : "Wrong password"})
    })

    it("should return token if password correct", async()=>{
        const mockedUser ={
            id:1,
            checkPassword : jest.fn(()=>Promise.resolve(true)),
        }
        usersRepository.findOne.mockResolvedValue(mockedUser);
        const result = await service.login(loginARgs);
        expect(jwtService.sign).toHaveBeenCalledTimes(1);
        expect(jwtService.sign).toHaveBeenCalledWith(expect.any(Number))
        expect(result).toEqual({ok:true, token:'signed-token'})
    })

    it("should fail on exception", async()=>{
      usersRepository.findOne.mockRejectedValue(new Error(":)"));
      const result = await service.login(loginARgs);
      expect(result).toEqual({ok:false, error:"Could not login"})
    })
  })

  
  describe('findById',()=>{
    const findByIdArgs = {
        id:1
    }

    it("should find an existing user", async ()=>{
        usersRepository.findOneOrFail.mockResolvedValue({id:1})
        const result = await service.findById(1);
        expect(result).toEqual({ok:true,user:{id:1}})
    })
    it("should fail if no user is found", async ()=>{

        usersRepository.findOneOrFail.mockRejectedValue(new Error());
        const result = await service.findById(1);
        expect(result).toEqual({ok:false, error:"User Not Found"})
    })
  });

  describe('editProfile',()=>{
      const oldUser = {
        email : "bs@old.com",
        verified:true,
      }
      const editProfileArgs = {
          userId:1,
          input : {email : 'bs@new.com'},
      }
      const newVerification={
          code : 'code',
      }
      const newUser ={
          email : editProfileArgs.input.email,
      }

      const editProfileArgsPassword = {
        userId : 1,
        input : {password : 'new.password'},
      }

      it("should change email", async()=>{
        usersRepository.findOne.mockResolvedValue(oldUser);
        const result = await service.editProfile(editProfileArgs.userId, editProfileArgs.input);
        expect(usersRepository.findOne).toHaveBeenCalledTimes(1)
        expect(usersRepository.findOne).toHaveBeenCalledWith(editProfileArgs.userId)
        expect(result).toEqual({ok:true})
      }) 

      it("should change password", async()=>{
        usersRepository.findOne.mockResolvedValue({password:'old'})
        const result = await service.editProfile(editProfileArgsPassword.userId, editProfileArgsPassword.input);
        expect(usersRepository.save).toHaveBeenCalledTimes(1);
        expect(usersRepository.save).toHaveBeenCalledWith(editProfileArgsPassword.input);
        expect(result).toEqual({ok:true})
      })

      it("should fail on exception", async()=>{
        usersRepository.findOne.mockRejectedValue(new Error(":)"));
        const result = await service.editProfile(editProfileArgs.userId, editProfileArgs.input);
        expect(result).toEqual({ok:false,error: 'Could not update profile'})
      })
  })

});

import { ArrowLeft, Coffee } from "lucide-react";
import { useNavigate } from "react-router-dom";

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b sticky top-0 bg-background z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="icon-btn">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">About TagCard</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Heading */}
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-12">
            The Story Behind TagCard
          </h1>

          {/* Story */}
          <div className="prose prose-lg max-w-none space-y-6 text-foreground">
            <p>
              It all started with my sister and a TikTok rant.
            </p>

            <p>
              She told me about this clip where someone said they were exhausted by the same old dating routine, 
              that is the <strong>SMALL TALK</strong>, and that ritual of asking <em>"What's your favorite color?"</em> on 
              every single date 😂 She laughed, I laughed, and then she said, <em>"Wouldn't it be nice if there was an 
              app where you just put your likes, dislikes, and a little about yourself and people could scan it and 
              know you, without the awkward guessing and small talk?"</em>
            </p>

            <p>
              That idea stuck. So I built <strong>TagCard!</strong> 🎉 Yeah the name is a work in progress....lol
            </p>

            <p>
              TagCard is a tiny, honest little app that does one thing very well: it puts the real you in one neat place: 
              bio, contact info, likes and dislikes and turns it into a scannable card (QR + printable business-card size PDF). 
              No swiping. Just your story, your tags, and the chance to skip small talk and jump into something actually interesting.
            </p>

            {/* Important Things Section */}
            <div className="bg-card border rounded-lg p-6 my-8 space-y-4">
              <h2 className="text-2xl font-bold mb-4">A few very important things to know:</h2>
              
              <div className="space-y-4">
                <div className="flex gap-3">
                  <span className="text-primary font-bold text-xl">1.</span>
                  <p>
                    This started as a way to make dating less repetitive, but it's <strong>not just for dating</strong>. 
                    Want to let a new friend or colleague know what you're into? TagCard works there too.
                  </p>
                </div>

                <div className="flex gap-3">
                  <span className="text-primary font-bold text-xl">2.</span>
                  <p>
                    It's <strong>intentionally minimal</strong>. I kept the app simple so you can set up and share 
                    in under a minute.
                  </p>
                </div>

                <div className="flex gap-3">
                  <span className="text-primary font-bold text-xl">3.</span>
                  <p>
                    TagCard is <strong>FREE</strong>. I'm not trying to hide features behind walls. If you've got ideas 
                    to improve the app, please{" "}
                    <a 
                      href="https://tagcard.canny.io/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary font-semibold hover:underline transition-all"
                    >
                      drop them here
                    </a>.
                  </p>
                </div>
              </div>
            </div>

            <p className="flex items-center gap-2">
              If you like what I made and want to support the project,{" "}
              <a 
                href="https://ko-fi.com/sirri" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary font-semibold hover:underline transition-all inline-flex items-center gap-1"
              >
                donations are welcome <Coffee size={18} className="inline" />
              </a>{" "}
              and very appreciated 😅
            </p>

            <div className="bg-muted/50 border-l-4 border-primary rounded-r-lg p-6 my-8">
              <p className="font-medium text-lg">
                <strong>Why I care:</strong> I got tired of seeing good conversations never get started because people 
                were stuck in the small-talk loop 🥱. TagCard is my attempt to let people skip the checklist and get to 
                the interesting stuff that actually matters. 
              </p>
            </div>

            {/* Signature */}
            <div className="mt-12 pt-8 border-t">
              <p className="font-medium">Enjoy TagCard,</p>
              <div className="mt-4 space-y-1">
                <p className="text-lg font-bold">Sirri Ayongwa</p>
                <p className="text-muted-foreground">Founder & Developer</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default About;
